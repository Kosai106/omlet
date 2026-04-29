use ahash::{AHashMap, AHashSet};
use lazy_static::lazy_static;
use pathdiff::diff_paths;
use regex::{escape as escape_regex, Regex};
use relative_path::{RelativePath, RelativePathBuf};
use serde::{
    de::{MapAccess, Visitor},
    Deserialize, Deserializer, Serialize, Serializer,
};
use std::fmt::{Debug, Formatter};
use std::path::Path;
use std::{
    cmp::Ordering,
    collections::{HashMap, HashSet},
    fmt::{self, Display},
    hash::{Hash, Hasher},
};

use logger::{debug, trace};
use utils::{generate_definition_id, get_plain_path, hash_path, hash_string};

use crate::parser::ReferenceWithSource;
use crate::{analyzer::Export, parser::symbol::DEFAULT_EXPORT_NAME};

#[derive(Clone, Debug, Hash, PartialEq, Eq, Ord, PartialOrd, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ModuleType {
    Package,
    Local,
}

fn serialize_hash<S>(hash: &u64, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(format!("{}", hash).as_str())
}

fn serialize_relpath<S>(rp: &RelativePathBuf, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(rp.as_str())
}

#[derive(Clone, Debug, Serialize)]
pub struct ModuleId {
    #[serde(serialize_with = "serialize_hash")]
    pub hash: u64,
    #[serde(serialize_with = "serialize_relpath")]
    pub path: RelativePathBuf,
    #[serde(rename = "package_name")]
    pub pkg_name: String,
    pub mtype: ModuleType,
}

impl PartialEq for ModuleId {
    fn eq(&self, other: &Self) -> bool {
        self.hash == other.hash
    }
}

impl Hash for ModuleId {
    fn hash<H>(&self, state: &mut H)
    where
        H: Hasher,
    {
        self.hash.hash(state);
    }
}

impl Eq for ModuleId {}

impl Ord for ModuleId {
    fn cmp(&self, other: &Self) -> Ordering {
        self.path.cmp(&other.path)
    }
}

impl PartialOrd for ModuleId {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

lazy_static! {
    static ref FILE_EXTENSION_RE: Regex = Regex::new("\\.[jt]sx?$").unwrap();
}

impl ModuleId {
    pub fn new(path: &RelativePath, mtype: ModuleType, pkg_name: &str) -> Self {
        let (package_name, import_path) = if mtype == ModuleType::Local {
            (pkg_name.to_string(), path.to_string())
        } else {
            let pkg_name_iter = pkg_name.split("/").enumerate();

            let split_pos = if pkg_name.starts_with("@") { 2 } else { 1 };
            let (package_name, file_path): (Vec<(usize, &str)>, Vec<(usize, &str)>) =
                pkg_name_iter.partition(|(index, _)| *index < split_pos);

            (
                package_name
                    .into_iter()
                    .map(|(_, part)| part)
                    .collect::<Vec<&str>>()
                    .join("/"),
                file_path
                    .into_iter()
                    .map(|(_, part)| part)
                    .collect::<Vec<&str>>()
                    .join("/"),
            )
        };

        let file_path = RelativePath::new(&import_path);

        let path_str = get_plain_path(&import_path);

        let module_hash_seed = if import_path == "" {
            package_name.clone()
        } else {
            format!("{}:{}", package_name, path_str)
        };

        Self {
            hash: hash_string(&module_hash_seed),
            path: file_path.to_relative_path_buf(),
            mtype,
            pkg_name: package_name,
        }
    }

    pub fn get_path_hash(&self) -> String {
        let path_str = get_plain_path(self.path.as_str());

        hash_path(&path_str)
    }

    pub fn is_local(&self) -> bool {
        self.mtype == ModuleType::Local
    }

    pub fn is_external(&self) -> bool {
        self.mtype == ModuleType::Package
    }
}

impl Display for ModuleId {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "(hash={:x}, path={}, type={:?})",
            self.hash, self.path, self.mtype
        )
    }
}

#[derive(Debug)]
enum AliasPattern {
    Constant(String),
    Pattern(Regex),
}

#[derive(Debug)]
struct Alias {
    pattern: AliasPattern,
    paths: Vec<String>,
}

impl Alias {
    fn is_match(&self, s: &str) -> bool {
        match &self.pattern {
            AliasPattern::Constant(alias_str) => s == alias_str,
            AliasPattern::Pattern(re) => re.is_match_at(s, 0),
        }
    }

    fn get_substitutions(&self, s: &str) -> Option<Vec<String>> {
        if !self.is_match(s) {
            return None;
        }

        match &self.pattern {
            AliasPattern::Constant(alias_str) => Some(
                self.paths
                    .iter()
                    .map(|path| s.replace(alias_str, path))
                    .collect(),
            ),
            AliasPattern::Pattern(re) => Some(
                self.paths
                    .iter()
                    .filter_map(|path| {
                        re.captures(s).and_then(|c| {
                            c.get(1).and_then(|matching_component| {
                                Some(path.replace("*", matching_component.as_str()))
                            })
                        })
                    })
                    .collect(),
            ),
        }
    }

    fn is_static_pattern(&self) -> bool {
        matches!(&self.pattern, AliasPattern::Constant(_))
    }
}

#[derive(Debug)]
struct AliasMap(Vec<Alias>);
impl AliasMap {
    fn new() -> AliasMap {
        AliasMap(Vec::new())
    }
}

impl From<HashMap<String, Vec<String>>> for AliasMap {
    fn from(map: HashMap<String, Vec<String>>) -> Self {
        let mut entries: Vec<(String, Vec<String>)> = map.into_iter().collect();

        entries.sort_by(|(first_alias, _), (second_alias, _)| {
            second_alias.len().cmp(&first_alias.len())
        });

        AliasMap(
            entries
                .into_iter()
                .map(|(k, v)| {
                    let pattern = if k.contains("*") {
                        AliasPattern::Pattern(
                            Regex::new(escape_regex(&k).replace("\\*", "(.*)").as_str()).unwrap(),
                        )
                    } else {
                        AliasPattern::Constant(k)
                    };

                    Alias {
                        pattern,
                        paths: v
                            .iter()
                            // `paths` is used to expand aliased imports.
                            // File paths listed in the file_index set don't have extensions and `module-x/index` modules are translated to `module-x`
                            // So, we strip the file extensions and `/index` component from the paths.
                            .map(|p| (*FILE_NAME_RE).replace(&p, "").to_string())
                            .collect(),
                    }
                })
                .collect(),
        )
    }
}

lazy_static! {
    static ref FILE_NAME_RE: Regex = Regex::new("(/index)?\\.[jt]sx?$").unwrap();
}

struct AliasVisitor;

impl<'de> Visitor<'de> for AliasVisitor {
    type Value = AliasMap;

    // Format a message stating what data this Visitor expects to receive.
    fn expecting(&self, formatter: &mut Formatter) -> fmt::Result {
        formatter.write_str("a very special map")
    }

    fn visit_map<M>(self, mut access: M) -> Result<Self::Value, M::Error>
    where
        M: MapAccess<'de>,
    {
        let mut map: HashMap<String, Vec<String>> =
            HashMap::with_capacity(access.size_hint().unwrap_or(0));

        while let Some((key, value)) = access.next_entry::<String, Vec<String>>()? {
            map.insert(key, value);
        }

        Ok(AliasMap::from(map))
    }
}

// This is the trait that informs Serde how to deserialize AliasMap.
impl<'de> Deserialize<'de> for AliasMap {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        // Instantiate our Visitor and ask the Deserializer to drive
        // it over the input data, resulting in an instance of AliasMap.
        deserializer.deserialize_map(AliasVisitor)
    }
}

#[derive(Debug)]
enum PathMatcher {
    Constant(String),
    Pattern(Regex),
}

#[derive(Debug)]
struct EntryPointConfig {
    entry: String,
    patterns: Vec<PathMatcher>,
}

impl EntryPointConfig {
    fn find_matching_entry_point(&self, s: &str) -> Option<String> {
        self.patterns
            .iter()
            .find_map(|path_matcher| match path_matcher {
                PathMatcher::Constant(path_str) => {
                    if s.eq(path_str) {
                        Some(self.entry.clone())
                    } else {
                        None
                    }
                }
                PathMatcher::Pattern(re) => {
                    if let Some(matching_component) = re.captures(s).and_then(|cs| cs.get(1)) {
                        Some(self.entry.replace("*", matching_component.as_str()))
                    } else {
                        None
                    }
                }
            })
    }
}

#[derive(Debug)]
struct ExportMap(Vec<EntryPointConfig>);
impl ExportMap {
    fn new() -> ExportMap {
        ExportMap(Vec::new())
    }

    fn filter_matching_entry_points(&self, s: &str) -> Vec<String> {
        self.0
            .iter()
            .filter_map(|entry| entry.find_matching_entry_point(s))
            .collect()
    }
}

impl From<HashMap<String, Vec<String>>> for ExportMap {
    fn from(map: HashMap<String, Vec<String>>) -> Self {
        let mut entries: Vec<(String, Vec<String>)> = map.into_iter().collect();

        entries.sort_by(|(first_alias, _), (second_alias, _)| {
            first_alias.len().cmp(&second_alias.len())
        });

        ExportMap(
            entries
                .into_iter()
                .map(|(entry, v)| {
                    let patterns = if entry.contains("*") {
                        v.into_iter()
                            .map(|path| {
                                PathMatcher::Pattern(
                                    Regex::new(
                                        escape_regex(&get_plain_path(&path))
                                            .replace("\\*", "(.*)")
                                            .as_str(),
                                    )
                                    .unwrap(),
                                )
                            })
                            .collect()
                    } else {
                        v.into_iter()
                            .map(|path| PathMatcher::Constant(get_plain_path(path.as_str())))
                            .collect()
                    };

                    EntryPointConfig {
                        entry: get_plain_path(&entry),
                        patterns,
                    }
                })
                .collect(),
        )
    }
}

struct EntryPointConfigVisitor;

impl<'de> Visitor<'de> for EntryPointConfigVisitor {
    type Value = ExportMap;

    // Format a message stating what data this Visitor expects to receive.
    fn expecting(&self, formatter: &mut Formatter) -> fmt::Result {
        formatter.write_str("a very special map")
    }

    fn visit_map<M>(self, mut access: M) -> Result<Self::Value, M::Error>
    where
        M: MapAccess<'de>,
    {
        let mut map: HashMap<String, Vec<String>> =
            HashMap::with_capacity(access.size_hint().unwrap_or(0));

        while let Some((key, value)) = access.next_entry::<String, Vec<String>>()? {
            map.insert(key, value);
        }

        Ok(ExportMap::from(map))
    }
}

// This is the trait that informs Serde how to deserialize ExportMap.
impl<'de> Deserialize<'de> for ExportMap {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        // Instantiate our Visitor and ask the Deserializer to drive
        // it over the input data, resulting in an instance of ExportMap.
        deserializer.deserialize_map(EntryPointConfigVisitor)
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageInfo {
    name: String,
    path: String,
    aliases: AliasMap,
    import_map: AliasMap,
    export_map: ExportMap,
}

pub trait AsPackageInfoData {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn path(&self) -> &str;
    fn aliases(&self) -> &HashMap<String, Vec<String>>;
    fn import_map(&self) -> &HashMap<String, Vec<String>>;
    fn export_map(&self) -> &HashMap<String, Vec<String>>;
}

impl PackageInfo {
    fn from_package_info_data<T: AsPackageInfoData>(source: &T) -> Self {
        Self {
            name: source.name().to_string(),
            path: source.path().to_string(),
            aliases: source.aliases().clone().into(),
            import_map: source.import_map().clone().into(),
            export_map: source.export_map().clone().into(),
        }
    }
}

impl<T: AsPackageInfoData> From<T> for PackageInfo {
    fn from(item: T) -> Self {
        PackageInfo::from_package_info_data(&item)
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSetup {
    pub root: PackageInfo,
    pub packages: HashMap<String, PackageInfo>,
    pub absolute_path: String,
}

impl ProjectSetup {
    fn dummy() -> Self {
        Self {
            root: PackageInfo {
                name: String::from("root"),
                path: String::from("root/package/path"),
                aliases: AliasMap::new(),
                import_map: AliasMap::new(),
                export_map: ExportMap::new(),
            },
            packages: HashMap::new(),
            absolute_path: String::from("/"),
        }
    }

    pub fn new(
        root: PackageInfo,
        packages: HashMap<String, PackageInfo>,
        absolute_path: String,
    ) -> ProjectSetup {
        ProjectSetup {
            root,
            packages,
            absolute_path,
        }
    }
}

#[derive(Hash, Eq, PartialEq, Serialize)]
pub struct ExportId {
    pkg_name: String,
    path: String,
    name: String,
}

impl ExportId {
    fn new(pkg_name: String, path: String, name: String) -> Self {
        Self {
            pkg_name,
            path,
            name,
        }
    }
}

impl ToString for ExportId {
    fn to_string(&self) -> String {
        generate_definition_id(&self.pkg_name, &hash_path(&self.path), &self.name)
    }
}

impl Debug for ExportId {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{}:{}:{}",
            &self.pkg_name,
            if self.path == "" { "." } else { &self.path },
            &self.name
        )
    }
}

#[derive(Debug)]
pub struct ModuleResolver {
    project_setup: ProjectSetup,
    file_index: HashSet<String>,
}

impl ModuleResolver {
    pub fn empty() -> Self {
        Self {
            project_setup: ProjectSetup::dummy(),
            file_index: HashSet::new(),
        }
    }

    pub fn new(
        mut project_setup: ProjectSetup,
        file_list: &Vec<RelativePathBuf>,
    ) -> ModuleResolver {
        debug!("Parsing project setup data: {:#?}", project_setup);
        if project_setup.root.path.len() > 0 && !project_setup.root.path.ends_with("/") {
            project_setup.root.path.push_str("/");
        }

        for (_, package) in &mut project_setup.packages {
            if package.path.len() > 0 && !package.path.ends_with("/") {
                package.path.push_str("/");
            }
        }

        let mut file_index: HashSet<String> = HashSet::new();
        let re = Regex::new(r"index.[jt]sx?$").unwrap();
        for relative_path in file_list {
            file_index.insert(relative_path.with_extension("").to_string());
            if re.is_match(relative_path.file_name().unwrap()) {
                file_index.insert(relative_path.parent().unwrap().to_string());
            }
        }

        debug!("File index:\n{:#?}", file_index);
        debug!("Project setup:\n{:#?}", project_setup);

        ModuleResolver {
            project_setup,
            file_index,
        }
    }

    fn find_pkg_info(&self, file_path: &str) -> Option<&PackageInfo> {
        let file_path = RelativePathBuf::from(file_path);

        let mut max_match_length = 0;
        let mut package_info: Option<&PackageInfo> = None;
        for (_, package) in &self.project_setup.packages {
            let path_len = package.path.len();
            if file_path.starts_with(package.path.as_str()) && path_len > max_match_length {
                debug!(
                    "Found match: {} (pkg_path: {}, file_path: {})",
                    package.name,
                    package.path.as_str(),
                    file_path
                );

                package_info = Some(package);
                max_match_length = path_len;
            }
        }

        package_info.or_else(|| {
            if file_path.starts_with(self.project_setup.root.path.as_str()) {
                debug!(
                    "Found match: {} (root) (file_path: {})",
                    self.project_setup.root.name, file_path
                );
                Some(&self.project_setup.root)
            } else {
                None
            }
        })
    }

    fn lookup_aliased_import(&self, import_path: &str, alias: &Alias) -> Option<String> {
        trace!("Checking alias {:?}", alias.pattern);
        if let Some(mut paths) = alias.get_substitutions(import_path) {
            // If it's a static pattern then we should resolve to the first item in the corresponding entry without checking existence of the target path
            if alias.is_static_pattern() {
                return if paths.is_empty() {
                    None
                } else {
                    Some(paths.remove(0))
                };
            }

            let result = paths.into_iter().find_map(|substituted_path| {
                trace!("Looking up file: {}", substituted_path);
                if self.file_index.contains(&substituted_path) {
                    trace!("File match found");
                    Some(substituted_path)
                } else {
                    trace!("No matching file");
                    None
                }
            });

            return result;
        }

        None
    }

    fn resolve_alias(&self, import_path: &str, src_module: &ModuleId) -> Option<String> {
        let lookup_in_aliases = |alias_map: &AliasMap| -> Option<String> {
            alias_map
                .0
                .iter()
                .find_map(|alias| self.lookup_aliased_import(import_path, alias))
        };

        if let Some(package) = self.project_setup.packages.get(&src_module.pkg_name) {
            if let Some(resolved_path) = lookup_in_aliases(&package.aliases) {
                debug!(
                    "{} resolved to {} {})",
                    import_path, resolved_path, package.name
                );
                return Some(resolved_path);
            }
        }

        lookup_in_aliases(&self.project_setup.root.aliases)
    }

    // TODO: Refactor this function
    pub fn resolve_import_path(&self, import_path: &str, src_module: &ModuleId) -> ModuleId {
        debug!(
            "Resolving import path: {} (from {})",
            import_path, src_module.path
        );

        let import_path = if import_path.ends_with("/") {
            &import_path[..import_path.len() - 1]
        } else {
            import_path
        };

        // Check if the import path is an absolute path
        // If the OS is Windows, the path can start with any drive letter followed by a colon
        // We need to support both file separator options
        // For example, both `C:/path/to/file`, `C:\path\to\file`, `/path/to/file`, and `\path\to\file` should be supported
        let absolute_path_regex = Regex::new(r"^(/|\w:\\|\\|\w:/)").unwrap();

        if absolute_path_regex.is_match(import_path) {
            let relative_path = diff_paths(
                Path::new(import_path),
                Path::new(&self.project_setup.absolute_path),
            )
            .unwrap();
            let relative_path = relative_path.to_str().unwrap();

            // Normalize the path separators to forward slashes
            let relative_path = relative_path.replace("\\", "/");

            debug!("Found absolute path, resolved to {}", relative_path);
            return ModuleId::new(
                RelativePath::new(&relative_path),
                ModuleType::Local,
                &src_module.pkg_name,
            );
        }

        if import_path.starts_with(".") {
            let rel_path = src_module
                .path
                .parent()
                .unwrap()
                .join_normalized(import_path);

            debug!("Found relative, resolved to {}", rel_path);

            return ModuleId::new(&rel_path, ModuleType::Local, &src_module.pkg_name);
        }

        let get_module_id = |resolved_path: String| {
            if self.file_index.contains(&resolved_path) {
                return self.get_module_id(&resolved_path);
            }

            return ModuleId::new(
                &RelativePath::new(&resolved_path),
                ModuleType::Package,
                &resolved_path,
            );
        };

        // Lookup in aliases first
        if let Some(resolved_path) = self.resolve_alias(import_path, src_module) {
            return get_module_id(resolved_path);
        }

        let lookup_in_package_import_map = |package: &PackageInfo| -> Option<String> {
            package
                .import_map
                .0
                .iter()
                .find_map(|alias| self.lookup_aliased_import(import_path, alias))
        };

        // Lookup in the importing package next
        if let Some(package) = self.project_setup.packages.get(&src_module.pkg_name) {
            if let Some(resolved_path) = lookup_in_package_import_map(package) {
                debug!(
                    "{} resolved to {} {})",
                    import_path, resolved_path, package.name
                );
                return get_module_id(resolved_path);
            }
        }

        // Lookup in the root package last
        if let Some(resolved_path) = lookup_in_package_import_map(&self.project_setup.root) {
            debug!(
                "{} resolved to {} {})",
                import_path, resolved_path, &self.project_setup.root.name
            );
            return get_module_id(resolved_path);
        }

        ModuleId::new(
            &RelativePath::new(import_path),
            ModuleType::Package,
            import_path,
        )
    }

    pub fn get_module_id(&self, file_path: &str) -> ModuleId {
        debug!("Find pkg name for {}", file_path);

        let pkg_name = self
            .find_pkg_info(file_path)
            .map_or_else(|| String::from("UNKNOWN"), |pkg_info| pkg_info.name.clone());

        ModuleId::new(
            &RelativePathBuf::from(file_path),
            ModuleType::Local,
            pkg_name.as_str(),
        )
    }

    pub fn get_export_map(
        &self,
        exports: &Vec<Export>,
    ) -> AHashMap<ReferenceWithSource, AHashSet<ExportId>> {
        let mut export_map: AHashMap<ReferenceWithSource, AHashSet<ExportId>> = AHashMap::new();

        for export in exports.iter() {
            if !export.is_component {
                continue;
            }

            debug!(
                "Generating export ids: pkg={} path={} export={}",
                &export.module_id.pkg_name, &export.module_id.path, &export.name,
            );

            let package = if self.project_setup.root.name == export.module_id.pkg_name {
                Some(&self.project_setup.root)
            } else {
                self.project_setup.packages.get(&export.module_id.pkg_name)
            };

            if package.is_none() {
                debug!(
                    "Package couldn't be found skipping export ({})",
                    export.module_id.pkg_name
                );
                continue;
            }

            let package = package.unwrap();
            let package_export_map = &package.export_map;

            let package_path = RelativePathBuf::from(&package.path);
            let import_path =
                get_plain_path(package_path.relative(&export.module_id.path).as_str());

            let export_name = if export.name == DEFAULT_EXPORT_NAME {
                String::from("default")
            } else {
                export.name.clone()
            };

            debug!(
                "Adding export id for source export: pkg={} path={} export={}",
                &export.module_id.pkg_name, &import_path, &export_name,
            );

            export_map
                .entry(export.reference.clone())
                .and_modify(|export_ids| {
                    export_ids.insert(ExportId::new(
                        export.module_id.pkg_name.clone(),
                        import_path.to_string(),
                        export_name.clone(),
                    ));
                })
                .or_insert_with(|| {
                    let mut export_ids = AHashSet::new();
                    export_ids.insert(ExportId::new(
                        export.module_id.pkg_name.clone(),
                        import_path.to_string(),
                        export_name.clone(),
                    ));
                    export_ids
                });

            let matching_entry_point =
                package_export_map.filter_matching_entry_points(&import_path);
            for export_entry_point in matching_entry_point {
                let path_str = if export_entry_point == "." {
                    ""
                } else {
                    export_entry_point.as_ref()
                };

                debug!(
                    "Adding export id for matching export entry: pkg={} path={} export={}",
                    &export.module_id.pkg_name, &path_str, &export_name,
                );

                export_map
                    .entry(export.reference.clone())
                    .and_modify(|export_ids| {
                        export_ids.insert(ExportId::new(
                            export.module_id.pkg_name.clone(),
                            path_str.to_string(),
                            export_name.clone(),
                        ));
                    });
            }
        }

        export_map
    }
}

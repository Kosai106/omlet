use omlet::analyzer::AnalyzerResult;
use omlet::module_resolver::{AsPackageInfoData, ModuleResolver, ProjectSetup};
use omlet::parser::CharacterPosition;
use relative_path::RelativePathBuf;

use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::mpsc::{self, RecvError};
use std::time::Instant;
use std::time::{SystemTime, UNIX_EPOCH};
use std::{path::PathBuf, rc::Rc, thread};

use git_utils::{get_file_dates, GitUtilError};
use logger::{debug, error, get_filter_level, info, init as init_logger, LoggerOptions};
use napi_derive::napi;

use memory_stats::memory_stats;
use omlet::{
    analyzer::{Analyzer, AnalyzerError},
    parser::{Module, ObjectPropValue, ParserError, PropValue},
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use utils::{glob, list_all_project_files, GlobError};

fn get_logger_config<'a>(level: &str, log_file_path: Option<&'a String>) -> LoggerOptions<'a> {
    let file_path = log_file_path.map(|path| path.as_str());

    LoggerOptions {
        enable_console_logger: false,
        enable_file_logger: log_file_path.is_some(),
        log_level: get_filter_level(level),
        file_path,
    }
}

#[derive(Serialize, Debug)]
enum Error {
    GlobError {
        root: PathBuf,
        pattern: String,
        reason: String,
    },
    TSParseError {
        reason: Vec<String>,
        file: String,
    },
    AnalysisError {
        reason: String,
    },
    GitUtilError {
        reason: String,
        suggestion: String,
    },
    MpscError {
        reason: String,
    },
}

impl Error {
    fn to_napi_error(&self) -> Result<napi::Error, napi::Error> {
        let mut error_object = serde_json::Map::new();
        error_object.insert("error".to_string(), serde_json::to_value(self)?);

        let error_content = serde_json::to_string(&serde_json::Value::Object(error_object))
            .map_err(|err| {
                error!(
                    "Couldn't transform error to JSON. Error: {:#?}. Reason: {}",
                    self,
                    err.to_string()
                );

                let reason = format!("Couldn't transform error to JSON: {}", err.to_string());

                napi::Error::new(napi::Status::Unknown, reason)
            })?;

        Ok(napi::Error::new(
            napi::Status::GenericFailure,
            error_content,
        ))
    }
}

impl From<GlobError> for Error {
    fn from(ge: GlobError) -> Self {
        Self::GlobError {
            root: ge.root,
            pattern: ge.pattern,
            reason: ge.reason,
        }
    }
}

impl From<ParserError> for Error {
    fn from(pe: ParserError) -> Self {
        Self::TSParseError {
            file: pe.file,
            reason: pe.reason,
        }
    }
}

impl From<AnalyzerError> for Error {
    fn from(ae: AnalyzerError) -> Self {
        Self::AnalysisError { reason: ae.reason }
    }
}

impl From<GitUtilError> for Error {
    fn from(error: GitUtilError) -> Self {
        Self::GitUtilError {
            reason: error.reason,
            suggestion: error.suggestion,
        }
    }
}

impl From<RecvError> for Error {
    fn from(error: RecvError) -> Self {
        Self::MpscError {
            reason: error.to_string(),
        }
    }
}

fn map_error<E: Into<Error>>(internal_error: E) -> napi::Error {
    let error: Error = internal_error.into();

    match error.to_napi_error() {
        Ok(ne) => ne,
        Err(e) => e,
    }
}

#[derive(Serialize, Debug)]
#[serde(tag = "type")]
pub enum ObjectPropNapiValue {
    Spread { value: Box<PropValue> },

    Shorthand { key: String },

    KeyValue { key: String, value: Box<PropValue> },
}

#[derive(Serialize, Debug)]
#[serde(tag = "type")]
pub enum PropValueNapiValue {
    String {
        value: String,
    },
    Number {
        value: f64,
    },
    Identifier {
        value: String,
    },
    Bool {
        value: bool,
    },
    Regex {
        value: String,
        flags: String,
    },
    Array {
        values: Vec<PropValueNapiValue>,
    },
    Spread {
        value: Box<PropValueNapiValue>,
    },
    Member {
        value: Box<PropValueNapiValue>,
        property: Box<PropValueNapiValue>,
    },
    Null,
    JSXElement,
    Function,
    Getter,
    Setter,
    Object {
        props: Vec<ObjectPropNapiValue>,
    },
    This,
    Super,
    TemplateLiteral,
    Expression,
}

#[napi(object)]
#[derive(Serialize, Debug)]
pub struct CharacterPositionNapiValue {
    pub line: u32,
    pub column: u32,
}

impl From<CharacterPosition> for CharacterPositionNapiValue {
    fn from(pos: CharacterPosition) -> Self {
        Self {
            line: pos.line as u32,
            column: pos.column as u32,
        }
    }
}

#[napi(object)]
#[derive(Serialize, Debug)]
pub struct ComponentPropNapiValue {
    pub name: String,
    // napi cannot generate typescript code for struct within enum variant
    // we need to serialize instead
    pub default_value: Option<String>,
    pub start: CharacterPositionNapiValue,
    pub end: CharacterPositionNapiValue,
}

#[napi(object)]
#[derive(Serialize, Debug)]
pub struct HtmlElementSpanNapiValue {
    pub start: CharacterPositionNapiValue,
    pub end: CharacterPositionNapiValue,
}

#[napi(object)]
#[derive(Serialize, Debug)]
pub struct HtmlElementUsageNapiValue {
    pub tag: String,
    pub count: u32,
    pub spans: Vec<HtmlElementSpanNapiValue>,
}

#[napi(object)]
#[derive(Serialize, Debug)]
pub struct ComponentNapiValue {
    pub id: String,
    pub export_ids: Vec<String>,
    pub name: String,
    pub source: String,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
    pub dependencies: Vec<String>,
    pub props: Vec<ComponentPropNapiValue>,
    pub html_elements: Vec<String>,
    pub html_element_usages: Vec<HtmlElementUsageNapiValue>,
    pub start: Option<CharacterPositionNapiValue>,
    pub end: Option<CharacterPositionNapiValue>,
}

#[napi(object)]
#[derive(Serialize, Debug)]
pub struct ExportNapiValue {
    pub name: String,
    pub module_id: String,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
    pub inferred_type: Option<String>,
    pub resolved_type: Option<String>,
    pub trace_to_declaration: Vec<String>,
    pub is_component: bool,
}

#[napi(object)]
#[derive(Serialize, Debug)]
pub struct AnalyzerResultNapiValue {
    pub components: Vec<ComponentNapiValue>,
    pub exports: Vec<ExportNapiValue>,
    pub errors: Vec<String>,
    pub stats: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PackageData {
    pub name: String,
    pub version: String,
    pub path: String,
    pub aliases: HashMap<String, Vec<String>>,
    pub import_map: HashMap<String, Vec<String>>,
    pub export_map: HashMap<String, Vec<String>>,
}

impl AsPackageInfoData for PackageData {
    fn name(&self) -> &str {
        &self.name
    }

    fn version(&self) -> &str {
        &self.version
    }

    fn path(&self) -> &str {
        &self.path
    }

    fn aliases(&self) -> &HashMap<String, Vec<String>> {
        &self.aliases
    }

    fn import_map(&self) -> &HashMap<String, Vec<String>> {
        &self.import_map
    }

    fn export_map(&self) -> &HashMap<String, Vec<String>> {
        &self.export_map
    }
}
#[napi(object)]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PathResolutionEntry {
    pub name: String,
    pub patterns: Vec<String>,
    pub r#type: String,
    pub source_path: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ResolutionConfigIssue {
    pub package_name: String,
    pub entry: PathResolutionEntry,
    pub r#type: String,
    pub level: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSetupExternal {
    pub root: PackageData,
    pub packages: HashMap<String, PackageData>,
    pub absolute_path: String,
}

impl From<ProjectSetupExternal> for ProjectSetup {
    fn from(external: ProjectSetupExternal) -> Self {
        let root = external.root.into();
        let packages = external
            .packages
            .into_iter()
            .map(|(key, value)| (key, value.into()))
            .collect();
        ProjectSetup::new(root, packages, external.absolute_path)
    }
}
fn convert_prop_value_to_napi_value(prop: &PropValue) -> PropValueNapiValue {
    match prop {
        PropValue::String { value } => PropValueNapiValue::String {
            value: value.to_string(),
        },
        PropValue::Number { value } => PropValueNapiValue::Number {
            value: value.clone(),
        },
        PropValue::Identifier { value } => PropValueNapiValue::Identifier {
            value: value.to_string(),
        },
        PropValue::Bool { value } => PropValueNapiValue::Bool {
            value: value.clone(),
        },
        PropValue::Regex { value, flags } => PropValueNapiValue::Regex {
            value: value.to_string(),
            flags: flags.to_string(),
        },
        PropValue::Null => PropValueNapiValue::Null,
        PropValue::JSXElement => PropValueNapiValue::JSXElement,
        PropValue::Function => PropValueNapiValue::Function,
        PropValue::Getter => PropValueNapiValue::Getter,
        PropValue::Setter => PropValueNapiValue::Setter,
        PropValue::Array { values } => PropValueNapiValue::Array {
            values: values
                .iter()
                .map(convert_prop_value_to_napi_value)
                .collect(),
        },
        PropValue::Object { props } => PropValueNapiValue::Object {
            props: props
                .iter()
                .filter_map(|object_value| match object_value {
                    ObjectPropValue::Spread { value } => Some(ObjectPropNapiValue::Spread {
                        value: value.clone(),
                    }),
                    ObjectPropValue::KeyValue { key, value } => {
                        Some(ObjectPropNapiValue::KeyValue {
                            key: key.clone(),
                            value: value.clone(),
                        })
                    }
                    ObjectPropValue::Shorthand { key } => {
                        Some(ObjectPropNapiValue::Shorthand { key: key.clone() })
                    }
                })
                .collect(),
        },
        PropValue::Spread { value } => PropValueNapiValue::Spread {
            value: Box::new(convert_prop_value_to_napi_value(value.as_ref())),
        },
        PropValue::Member { value, property } => PropValueNapiValue::Member {
            value: Box::new(convert_prop_value_to_napi_value(&*value)),
            property: Box::new(convert_prop_value_to_napi_value(&*property)),
        },
        PropValue::This => PropValueNapiValue::This,
        PropValue::Super => PropValueNapiValue::Super,
        PropValue::TemplateLiteral => PropValueNapiValue::TemplateLiteral,
        PropValue::Expression => PropValueNapiValue::Expression,
    }
}

fn convert_analyzer_result_to_napi_value(
    result: &AnalyzerResult,
    parser_errors: &Vec<Error>,
    stats: serde_json::Value,
) -> Result<AnalyzerResultNapiValue, napi::Error> {
    let components = result
        .components
        .iter()
        .map(|c| {
            let dependencies: Vec<String> = c
                .dependencies
                .iter()
                .map(|d| serde_json::to_string(&d))
                .collect::<serde_json::Result<Vec<String>>>()?;

            Ok(ComponentNapiValue {
                id: c.id.clone(),
                export_ids: c.export_ids.iter().map(|eid| eid.to_string()).collect(),
                name: c.name.clone(),
                source: serde_json::to_string(&c.source)?,
                created_at: c.created_at,
                updated_at: c.updated_at,
                dependencies,
                html_elements: c.html_elements.iter().map(|s| s.clone()).collect(),
                html_element_usages: c
                    .html_element_usages
                    .iter()
                    .map(|u| HtmlElementUsageNapiValue {
                        tag: u.tag.clone(),
                        count: u.count as u32,
                        spans: u
                            .spans
                            .iter()
                            .map(|s| HtmlElementSpanNapiValue {
                                start: s.start.clone().into(),
                                end: s.end.clone().into(),
                            })
                            .collect(),
                    })
                    .collect(),
                props: c
                    .props
                    .iter()
                    .map(|(_, p)| ComponentPropNapiValue {
                        name: p.name.clone(),
                        default_value: p
                            .default_value
                            .as_ref()
                            .map(convert_prop_value_to_napi_value)
                            .map(|v| -> Option<String> {
                                serde_json::to_string::<PropValueNapiValue>(&v).ok()
                            })
                            .flatten(),
                        start: CharacterPositionNapiValue::from(p.start.clone()),
                        end: CharacterPositionNapiValue::from(p.end.clone()),
                    })
                    .collect(),
                start: c.start.clone().map(|pos| pos.into()),
                end: c.end.clone().map(|pos| pos.into()),
            })
        })
        .collect::<serde_json::Result<Vec<ComponentNapiValue>>>()?;

    let exports = (&result.exports)
        .into_iter()
        .map(|e| {
            Ok(ExportNapiValue {
                name: e.name.clone(),
                module_id: serde_json::to_string(&e.module_id)?,
                created_at: e.created_at,
                updated_at: e.updated_at,
                inferred_type: Some(serde_json::to_string(&e.inferred_type)?),
                resolved_type: Some(serde_json::to_string(&e.resolved_type)?),
                trace_to_declaration: (&e.trace_to_declaration)
                    .into_iter()
                    .map(|t| serde_json::to_string(&t))
                    .collect::<serde_json::Result<Vec<String>>>()?,
                is_component: e.is_component,
            })
        })
        .collect::<serde_json::Result<Vec<ExportNapiValue>>>()?;

    Ok(AnalyzerResultNapiValue {
        components,
        exports,
        errors: parser_errors
            .into_iter()
            .map(|e| serde_json::to_string(&e))
            .collect::<serde_json::Result<Vec<String>>>()?,
        stats: stats.to_string(),
    })
}

fn get_current_process_rss() -> usize {
    let mem_usage = memory_stats().map_or(0, |usage| {
        debug!("Current physical memory usage: {}", usage.physical_mem);
        usage.physical_mem
    });
    mem_usage
}

#[napi(catch_unwind)]
pub async fn analyze(
    project_root: String,
    repo_root: String,
    input_patterns: Vec<String>,
    ignore_patterns: Vec<String>,
    log_level: Option<String>,
    log_file_path: Option<String>,
    project_setup: ProjectSetupExternal,
    git_history_limit: i64,
) -> napi::Result<AnalyzerResultNapiValue> {
    analyze_sync(
        project_root,
        repo_root,
        input_patterns,
        ignore_patterns,
        log_level,
        log_file_path,
        project_setup,
        Some(git_history_limit as u64),
    )
}

fn analyze_sync(
    project_root: String,
    repo_root: String,
    input_patterns: Vec<String>,
    ignore_patterns: Vec<String>,
    log_level: Option<String>,
    log_file_path: Option<String>,
    project_setup: ProjectSetupExternal,
    git_history_limit: Option<u64>,
) -> napi::Result<AnalyzerResultNapiValue> {
    if let Some(log_level) = log_level {
        let logger_config = get_logger_config(&log_level, log_file_path.as_ref());
        init_logger(logger_config);
    }

    let before_scan_rss = get_current_process_rss();

    info!("Scanning repository at {}. Parameters:", repo_root,);
    info!("\tproject_root = {}", project_root);
    info!("\tinput_patterns = {:?}", input_patterns);
    info!("\tignore_patterns = {:?}", ignore_patterns);

    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let pathspec = vec!["*.[jt]sx".into(), "*.[jt]s".into()];
        let file_dates = get_file_dates(&PathBuf::from(repo_root), git_history_limit, &pathspec)
            .map_err(map_error);
        match tx.send(file_dates) {
            Ok(_) => {}
            Err(err) => {
                error!("Failed to send file dates to the main thread: {}", err)
            }
        }
    });

    let after_file_dates_rss = get_current_process_rss();

    let project_root = PathBuf::from(project_root);
    let input_files = glob(&project_root, &input_patterns, &ignore_patterns)
        .map_err(map_error)?
        .collect::<Vec<RelativePathBuf>>();
    let all_files: Vec<RelativePathBuf> = list_all_project_files(&project_root)
        .map_err(map_error)?
        .collect();

    let project_setup = ProjectSetup::from(project_setup);
    let module_resolver = Rc::new(ModuleResolver::new(project_setup, &all_files));

    let after_project_setup_rss = get_current_process_rss();

    info!(
        "Parsing files at {:?} ({} files total)",
        project_root,
        input_files.len()
    );

    let start = Instant::now();
    let mut parser_errors = vec![];
    let modules: Vec<Rc<RefCell<Module>>> = all_files
        .iter()
        .map(|path| Module::new(&path, &project_root, &module_resolver))
        .filter_map(|r| {
            r.map_err(|e| parser_errors.push(Error::from(e)))
                .ok()
                .map(|module| Rc::new(RefCell::new(module)))
        })
        .collect();
    let parse_duration = start.elapsed().as_millis() as u64;
    let after_parse_rss = get_current_process_rss();

    info!("Parsing completed. Still extracting modified dates for files");
    let file_dates = rx.recv().map_err(map_error)??;
    for module in &modules {
        let mut module = module.as_ref().borrow_mut();
        let module_path = module.source_path.to_path(&project_root);
        let dates = file_dates.get(&module_path);
        module.created_at = dates.and_then(|fd| fd.created);
        module.updated_at = dates.map(|fd| fd.updated);
    }

    info!("Starting component usage analysis");

    let start = Instant::now();
    let mut analyzer =
        Analyzer::new(&modules, &module_resolver, input_files, true).map_err(map_error)?;
    let result = analyzer.analyze();
    let analyze_duration = start.elapsed().as_millis() as u64;
    let after_analyze_rss = get_current_process_rss();

    let stats = json!({
        "date_extraction_msec": file_dates.duration_msec,
        "parse_duration_msec": parse_duration,
        "analyze_duration_msec": analyze_duration,
        "num_of_deltas": file_dates.num_of_deltas,
        "num_of_commits": file_dates.num_of_commits,
        "num_of_components": result.components.len(),
        "num_of_modules": modules.len(),
        "num_of_exports": result.exports.len(),
        "num_of_dependencies": result.get_num_of_dependencies(),
        "mem_usages": {
            "before_scan_rss": before_scan_rss,
            "after_file_dates_rss": after_file_dates_rss,
            "after_project_setup_rss": after_project_setup_rss,
            "after_parse_rss": after_parse_rss,
            "after_analyze_rss": after_analyze_rss,
        },
    });

    convert_analyzer_result_to_napi_value(&result, &parser_errors, stats.clone()).or_else(|err| {
        error!("JSON conversion error: {}", err);
        error!("Dumping analysis result");
        error!("{:#?}", result);
        error!("{:#?}", parser_errors);
        error!("{:#?}", stats);

        Err(err)
    })
}

#[napi]
pub async fn parse(
    project_root: String,
    repo_root: String,
    input_patterns: Vec<String>,
    ignore_patterns: Vec<String>,
    log_level: Option<String>,
    log_file_path: Option<String>,
    project_setup: ProjectSetupExternal,
    git_history_limit: i64,
) -> napi::Result<String> {
    parse_sync(
        project_root,
        repo_root,
        input_patterns,
        ignore_patterns,
        log_level,
        log_file_path,
        project_setup,
        Some(git_history_limit as u64),
    )
}

fn parse_sync(
    project_root: String,
    repo_root: String,
    input_patterns: Vec<String>,
    ignore_patterns: Vec<String>,
    log_level: Option<String>,
    log_file_path: Option<String>,
    project_setup: ProjectSetupExternal,
    git_history_limit: Option<u64>,
) -> napi::Result<String> {
    if let Some(log_level) = log_level {
        let logger_config = get_logger_config(&log_level, log_file_path.as_ref());
        init_logger(logger_config);
    }

    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let pathspec = vec!["*.[jt]sx".into(), "*.[jt]s".into()];
        let file_dates = get_file_dates(&PathBuf::from(repo_root), git_history_limit, &pathspec)
            .map_err(map_error);
        match tx.send(file_dates) {
            Ok(_) => {}
            Err(err) => {
                error!("Failed to send file dates to the main thread: {}", err)
            }
        }
    });

    let project_root = PathBuf::from(project_root);
    let input_files = glob(&project_root, &input_patterns, &ignore_patterns)
        .map_err(map_error)?
        .collect::<Vec<RelativePathBuf>>();
    let all_files: Vec<RelativePathBuf> = list_all_project_files(&project_root)
        .map_err(map_error)?
        .collect();

    let project_setup = ProjectSetup::from(project_setup);
    let module_resolver = Rc::new(ModuleResolver::new(project_setup, &all_files));

    let mut parser_errors = vec![];
    let mut modules = input_files
        .iter()
        .map(|path| Module::new(&path, &project_root, &module_resolver))
        .filter_map(|r| r.map_err(|e| parser_errors.push(Error::from(e))).ok())
        .collect::<Vec<Module>>();

    let file_dates = rx.recv().map_err(map_error)??;
    for module in modules.iter_mut() {
        let module_path = module.source_path.to_path(&project_root);
        let dates = file_dates.get(&module_path);
        module.created_at = dates.and_then(|fd| fd.created);
        module.updated_at = dates.map(|fd| fd.updated);
    }

    Ok(serde_json::to_string(&modules)?)
}

#[cfg(test)]
mod tests {
    use std::{fs, path::PathBuf};

    use relative_path::RelativePathBuf;
    use serde_json::Error;
    use utils::get_project_root;

    use crate::ProjectSetupExternal;

    #[test]
    fn test_parse() {
        let glob_pattern = String::from("**/samples/typescript/src/simple/**/*.{tsx,ts}");
        let project_root = get_project_root(&PathBuf::from("../../samples/typescript")).unwrap();
        let repo_root = RelativePathBuf::from("../../..").to_logical_path(project_root.clone());
        let project_setup_str =
            fs::read_to_string(PathBuf::from("../../samples/typescript/alias-map.json")).unwrap();
        let project_setup: Result<ProjectSetupExternal, Error> =
            serde_json::from_str(&project_setup_str);
        let result = super::analyze_sync(
            project_root.to_str().unwrap().into(),
            repo_root.to_str().unwrap().into(),
            vec![glob_pattern],
            vec![],
            None,
            None,
            project_setup.unwrap(),
            None,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_analyze() {
        let glob_pattern = String::from("**/samples/typescript/src/simple/**/*.{tsx,ts}");
        let project_root = get_project_root(&PathBuf::from("../../samples/typescript")).unwrap();
        let repo_root = RelativePathBuf::from("../../..").to_logical_path(project_root.clone());
        let project_setup_str =
            fs::read_to_string(PathBuf::from("../../samples/typescript/alias-map.json")).unwrap();
        let project_setup: Result<ProjectSetupExternal, Error> =
            serde_json::from_str(&project_setup_str);
        let result = super::analyze_sync(
            project_root.to_str().unwrap().into(),
            repo_root.to_str().unwrap().into(),
            vec![glob_pattern],
            vec![],
            None,
            None,
            project_setup.unwrap(),
            None,
        );

        assert!(result.is_ok());
    }
}

#[napi(catch_unwind)]
pub async fn analyze_partial(
    project_root: String,
    modified_files: Vec<String>, // Files that were modified
    related_files: Vec<String>,  // Parent/child component files
    ignore_patterns: Vec<String>,
    project_setup: ProjectSetupExternal,
) -> napi::Result<AnalyzerResultNapiValue> {
    analyze_sync_partial(
        project_root,
        modified_files,
        related_files,
        ignore_patterns,
        project_setup,
    )
}

fn analyze_sync_partial(
    project_root: String,
    modified_files: Vec<String>,
    related_files: Vec<String>,
    ignore_patterns: Vec<String>,
    project_setup: ProjectSetupExternal,
) -> napi::Result<AnalyzerResultNapiValue> {
    let before_scan_rss = get_current_process_rss();

    info!("\tproject_root = {}", project_root);
    info!("\tmodified_files = {:?}", modified_files);
    info!("\trelated_files = {:?}", related_files);
    info!("\tignore_patterns = {:?}", ignore_patterns);

    let project_root = PathBuf::from(project_root);

    let input_files: Vec<RelativePathBuf> = modified_files
        .iter()
        .chain(related_files.iter())
        .map(|p| RelativePathBuf::from(p))
        .collect();

    let all_files: Vec<RelativePathBuf> = list_all_project_files(&project_root)
        .map_err(map_error)?
        .collect();

    let project_setup = ProjectSetup::from(project_setup);
    let module_resolver = Rc::new(ModuleResolver::new(project_setup, &all_files));

    let after_project_setup_rss = get_current_process_rss();

    info!(
        "Parsing files at {:?} ({} files total)",
        project_root,
        input_files.len()
    );

    let start = Instant::now();
    let mut parser_errors = vec![];

    let modules: Vec<Rc<RefCell<Module>>> = input_files
        .iter()
        .map(|path| Module::new(&path, &project_root, &module_resolver))
        .filter_map(|r| {
            r.map_err(|e| parser_errors.push(Error::from(e)))
                .ok()
                .map(|module| Rc::new(RefCell::new(module)))
        })
        .collect();

    let parse_duration = start.elapsed().as_millis() as u64;
    let after_parse_rss = get_current_process_rss();

    info!("Parsing completed. Still extracting modified dates for files");

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    for module in &modules {
        let mut module = module.as_ref().borrow_mut();
        module.created_at = Some(now);
        module.updated_at = Some(now);
    }

    info!("Starting component usage analysis");

    let start = Instant::now();
    let mut analyzer =
        Analyzer::new(&modules, &module_resolver, input_files, true).map_err(map_error)?;
    let result = analyzer.analyze();
    let analyze_duration = start.elapsed().as_millis() as u64;
    let after_analyze_rss = get_current_process_rss();

    let stats = json!({
        "date_extraction_msec": 0,
        "parse_duration_msec": parse_duration,
        "analyze_duration_msec": analyze_duration,
        "num_of_deltas": 0,
        "num_of_commits": 0,
        "num_of_components": result.components.len(),
        "num_of_modules": modules.len(),
        "num_of_exports": result.exports.len(),
        "num_of_dependencies": result.get_num_of_dependencies(),
        "mem_usages": {
            "before_scan_rss": before_scan_rss,
            "after_file_dates_rss": 0,
            "after_project_setup_rss": after_project_setup_rss,
            "after_parse_rss": after_parse_rss,
            "after_analyze_rss": after_analyze_rss,
        },
    });

    convert_analyzer_result_to_napi_value(&result, &parser_errors, stats.clone()).or_else(|err| {
        error!("JSON conversion error: {}", err);
        error!("Dumping analysis result");
        error!("{:#?}", result);
        error!("{:#?}", parser_errors);
        error!("{:#?}", stats);

        Err(err)
    })
}

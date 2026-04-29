use std::env::current_dir;

use std::fs::read_dir;
use std::path::Path;
use std::{fmt, io};
use std::{hash::Hasher, path::PathBuf};

use ahash::AHasher;
use globset::{GlobBuilder, GlobSetBuilder};
use lazy_static::lazy_static;
use regex::Regex;
use relative_path::{RelativePath, RelativePathBuf};

use logger::{debug, error};
use sha2::{Digest, Sha256};

mod html_utils;

pub use html_utils::is_html_element;

const HASHER_KEYS: (u128, u128) = (1331, 6996);

pub fn hash_string(s: &str) -> u64 {
    let mut hasher = AHasher::new_with_keys(HASHER_KEYS.0, HASHER_KEYS.1);

    hasher.write(s.as_bytes());

    hasher.finish()
}

pub fn hash_path(path_str: &str) -> String {
    let mut hasher = Sha256::new();

    hasher.update(path_str);
    format!("{:x}", hasher.finalize())
}

lazy_static! {
    static ref FILE_EXTENSION_REGEX: Regex = Regex::new(r"\.[jt]sx?$").unwrap();
    static ref INDEX_FILE_REGEX: Regex = Regex::new(r"/index$").unwrap();
    static ref RELATIVE_PATH_REGEX: Regex = Regex::new(r"^\.*/").unwrap();
}

pub fn get_plain_path(path: &str) -> String {
    let path = FILE_EXTENSION_REGEX.replace(path, "");
    let path = INDEX_FILE_REGEX.replace(&*path, "");
    let path = RELATIVE_PATH_REGEX.replace(&*path, "");

    String::from(path)
}

pub fn generate_definition_id(package_name: &str, path_hash: &str, export_name: &str) -> String {
    format!("{}:{}:{}", package_name, path_hash, export_name)
}

#[derive(Debug)]
pub struct GlobError {
    pub root: PathBuf,
    pub pattern: String,
    pub reason: String,
}

impl GlobError {
    fn new(root: &Path, pattern: &String, reason: String) -> Self {
        Self {
            root: root.into(),
            pattern: pattern.clone(),
            reason,
        }
    }
}

impl fmt::Display for GlobError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "Failed to expand glob pattern '{}' (root: '{}').\nReason:{}.",
            self.pattern,
            self.root.to_str().unwrap_or("non-unicode path data"),
            self.reason,
        )
    }
}

pub fn glob(
    root: &Path,
    patterns: &[String],
    ignore_patterns: &[String],
) -> Result<impl Iterator<Item = RelativePathBuf>, GlobError> {
    let glob_matcher = {
        let mut builder = GlobSetBuilder::new();
        for pat in patterns {
            let glob = GlobBuilder::new(pat)
                .literal_separator(true)
                .build()
                .map_err(|err| GlobError::new(root, pat, err.to_string()))?;

            builder.add(glob);
        }

        builder
            .build()
            .map_err(|err| GlobError::new(root, &patterns.join(";"), err.to_string()))?
    };

    let ignore_matcher = if !ignore_patterns.is_empty() {
        let mut builder = GlobSetBuilder::new();
        for ignore_pat in ignore_patterns {
            let glob = GlobBuilder::new(ignore_pat)
                .literal_separator(true)
                .build()
                .map_err(|err| GlobError::new(root, ignore_pat, err.to_string()))?;

            builder.add(glob);
        }

        Some(
            builder
                .build()
                .map_err(|err| GlobError::new(root, &patterns.join(";"), err.to_string()))?,
        )
    } else {
        None
    };

    let root = if !root.is_relative() {
        root.to_path_buf()
    } else {
        return Result::Err(GlobError::new(
            root,
            &patterns.join(";"),
            String::from("Root path must be an absolute path"),
        ));
    };

    let iter = walkdir::WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_map(move |e| {
            if e.is_err() {
                error!("Glob error: {:?}", e.err());

                return None;
            }

            let entry = e.ok();

            if let Some(de) = entry {
                let path = de.path().strip_prefix(&root).unwrap_or_else(|_| de.path());
                let relative_path = RelativePathBuf::from_path(path);
                if relative_path.is_err() {
                    debug!(
                        "Cannot construct relative path for {:?}: {}",
                        path,
                        relative_path.unwrap_err()
                    );
                    return None;
                }

                let relative_path = relative_path.unwrap();
                let relative_path_str = relative_path.to_string();

                if ignore_matcher.is_some()
                    && ignore_matcher
                        .as_ref()
                        .unwrap()
                        .is_match(&relative_path_str)
                {
                    return None;
                }

                if glob_matcher.is_match(&relative_path_str) {
                    Some(relative_path)
                } else {
                    None
                }
            } else {
                None
            }
        });

    Result::Ok(iter)
}

pub fn get_glob_base(pattern: &str) -> Option<PathBuf> {
    pattern
        .split(&['*', '?', '[', '{'][..])
        .next()
        .map(|first_token| PathBuf::from(first_token))
}

pub fn get_project_root(start_from: &Path) -> Result<PathBuf, io::Error> {
    let mut ancestors = start_from.ancestors();
    let current_dir = current_dir()?;

    if !start_from.is_dir() {
        ancestors.next();
    }

    for p in ancestors {
        let has_package_json = {
            let mut found = false;
            for entry in read_dir(p)? {
                if entry?.file_name() == *"package.json" {
                    found = true;
                    break;
                }
            }

            found
        };

        if has_package_json {
            return Result::Ok(
                RelativePath::from_path(p)
                    .unwrap()
                    .to_logical_path(current_dir),
            );
        }
    }

    Result::Ok(current_dir)
}

pub fn list_all_project_files(
    root: &Path,
) -> Result<impl Iterator<Item = RelativePathBuf>, GlobError> {
    glob(
        root,
        &[String::from("**/*.{js,jsx,ts,tsx}")],
        &[String::from("**/node_modules/**")],
    )
}

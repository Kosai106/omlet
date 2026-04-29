use chrono::NaiveDateTime;
use serde::{Serialize, Serializer};
use std::collections::hash_map::Iter;
use std::collections::{BTreeMap, HashMap};
use std::env::current_dir;
use std::fs;
use std::hash::Hash;
use std::path::{Path, PathBuf};

use git_utils::{get_file_dates, FileDates};
use logger::info;

fn sort_map<K: Serialize + Ord, S: Serializer>(
    value: &HashMap<K, FileDates>,
    serializer: S,
) -> Result<S::Ok, S::Error> {
    let serialize_timestamp = |ts| {
        NaiveDateTime::from_timestamp_opt(ts, 0)
            .unwrap()
            .format("%Y-%m-%d")
            .to_string()
    };

    let ordered: BTreeMap<_, _> = value
        .iter()
        .map(|(k, v)| {
            let mut dates = serde_yaml::Mapping::new();

            if let Some(created) = v.created {
                dates.insert("created".into(), serialize_timestamp(created).into());
            }

            dates.insert("modified".into(), serialize_timestamp(v.updated).into());

            (k, dates)
        })
        .collect();
    ordered.serialize(serializer)
}

#[derive(Serialize)]
struct SortedMap<K: Serialize + Ord>(#[serde(serialize_with = "sort_map")] HashMap<K, FileDates>);

impl<K: Ord + Serialize + Hash + Clone> SortedMap<K> {
    fn from_iter(it: Iter<K, FileDates>) -> Self {
        Self(HashMap::from_iter(
            it.map(|(k, v)| ((*k).clone(), (*v).clone())),
        ))
    }
}

pub fn run(project_root: &Path, limit: Option<u64>, no_file_filter: bool) {
    let root = String::from(project_root.to_str().unwrap());
    let pathspec = if no_file_filter {
        vec![]
    } else {
        vec!["*.[jt]sx".into(), "*.[jt]s".into()]
    };

    let file_date_map = get_file_dates(&PathBuf::from(root), limit, &pathspec).unwrap();

    info!(
        "Git history processing done (processed {} commits, {} deltas in {} secs)",
        file_date_map.num_of_commits,
        file_date_map.num_of_deltas,
        file_date_map.duration_msec as f32 / 1000.0
    );

    let mut yaml_object = serde_yaml::Mapping::new();
    yaml_object.insert(
        "files".into(),
        serde_yaml::to_value(&SortedMap::from_iter(file_date_map.into_iter())).unwrap(),
    );
    yaml_object.insert("num_of_commits".into(), file_date_map.num_of_commits.into());
    yaml_object.insert("num_of_deltas".into(), file_date_map.num_of_deltas.into());
    yaml_object.insert("duration_msec".into(), file_date_map.duration_msec.into());

    fs::write(
        Path::join(current_dir().unwrap().as_path(), "results.yaml"),
        serde_yaml::to_string(&yaml_object).unwrap(),
    )
    .unwrap();
}

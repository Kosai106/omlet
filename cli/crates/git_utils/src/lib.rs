use std::collections::HashSet;
use std::ops::Sub;
use std::time::{Duration, Instant, SystemTime};
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};

use git2::{Commit, Delta, DiffFindOptions, DiffOptions, Oid, Repository, Sort};
use logger::{debug, info, trace};
use relative_path::RelativePath;

#[derive(Debug, Default, Clone)]
pub struct FileDates {
    pub updated: i64,
    pub created: Option<i64>,
}

impl FileDates {
    fn new(date: i64) -> Self {
        FileDates {
            updated: date,
            created: None,
        }
    }
}

#[derive(Debug)]
pub struct GitUtilError {
    pub reason: String,
    pub suggestion: String,
}

impl GitUtilError {
    fn new_commit_not_found_err() -> Self {
        Self {
            reason: String::from("Cannot find commits."),
            suggestion: String::from("Please make sure that the repo is not a shallow clone."),
        }
    }
}

#[derive(Debug)]
pub struct FileDateMap {
    items: HashMap<PathBuf, FileDates>,
    pub num_of_commits: usize,
    pub num_of_deltas: usize,
    pub duration_msec: u64,
}

impl FileDateMap {
    fn new() -> Self {
        Self {
            items: HashMap::new(),
            num_of_commits: 0,
            num_of_deltas: 0,
            duration_msec: 0,
        }
    }

    pub fn get(&self, path: &Path) -> Option<&FileDates> {
        self.items.get(path)
    }
}

impl<'a> IntoIterator for &'a FileDateMap {
    type Item = (&'a PathBuf, &'a FileDates);
    type IntoIter = std::collections::hash_map::Iter<'a, PathBuf, FileDates>;

    fn into_iter(self) -> std::collections::hash_map::Iter<'a, PathBuf, FileDates> {
        self.items.iter()
    }
}

fn get_day_of_commit(commit: &Commit) -> i64 {
    get_commit_timestamp_utc(commit) / 3600 / 24
}

fn get_commit_timestamp_utc(commit: &Commit) -> i64 {
    let commit_time = commit.time();

    commit_time.seconds() + (commit_time.offset_minutes() as i64 * 60)
}

fn find_target_commits(
    repo: &Repository,
    day_limit: Option<u64>,
) -> impl Iterator<Item = Result<Commit, GitUtilError>> {
    let mut revwalk = repo.revwalk().unwrap();
    revwalk.set_sorting(Sort::TIME).unwrap();
    revwalk.simplify_first_parent().unwrap();
    revwalk.push_head().unwrap();

    let timestamp_limit = day_limit.map_or(0, |days| {
        SystemTime::now()
            .sub(Duration::from_secs(days * 24 * 3600))
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64
    });

    if let Some(days) = day_limit {
        debug!("Processing commits in the last {} days", days);
    } else {
        debug!("No history limited provided. Processing the entire git history");
    }

    let mut seen_days = HashSet::new();
    let get_commit =
        |revwalk_item: Result<Oid, _>| revwalk_item.ok().and_then(|oid| repo.find_commit(oid).ok());

    revwalk
        .into_iter()
        .filter_map(move |item| match get_commit(item) {
            Some(commit) => {
                if seen_days.insert(get_day_of_commit(&commit)) {
                    Some(Ok(commit))
                } else {
                    None
                }
            }
            None => Some(Err(GitUtilError::new_commit_not_found_err())),
        })
        .take_while(move |r| match &r {
            Ok(commit) => get_commit_timestamp_utc(&commit) >= timestamp_limit,
            Err(_) => true,
        })
}

fn find_latest_parent_in_previous_days<'a>(commit: &Commit<'a>) -> Option<Commit<'a>> {
    let commit_day = get_day_of_commit(commit);
    let mut next_parent = commit.parent(0).ok()?;

    while get_day_of_commit(&next_parent) == commit_day {
        next_parent = next_parent.parent(0).ok()?;
    }

    return Some(next_parent);
}

pub fn get_file_dates(
    root: &Path,
    history_window_days: Option<u64>,
    pathspec: &Vec<String>,
) -> Result<FileDateMap, GitUtilError> {
    let start = Instant::now();
    let mut file_date_map = FileDateMap::new();
    let mut file_renames: HashMap<PathBuf, PathBuf> = HashMap::new();
    let mut deleted_files: HashSet<PathBuf> = HashSet::new();

    info!("Reading repository metadata - {:?}", root);

    let repo = Repository::open(root).unwrap();
    let mut diff_opts = DiffOptions::new();
    pathspec.iter().for_each(|ps| {
        diff_opts.pathspec(ps);
    });
    let mut find_opts = DiffFindOptions::new();
    find_opts.renames(true);

    info!("Start processing commits");

    let mut commits = find_target_commits(&repo, history_window_days);
    let mut commit = commits.next().transpose()?;
    while let Some(current_commit) = commit {
        // When there's no commit left in the list use current commit's earliest parent, if it has any, as the base
        // Otherwise base_tree would be None and incorrect diff would be generated
        let base_commit = commits.next().transpose()?;
        let file_mod_time = get_commit_timestamp_utc(&current_commit);
        let tree = current_commit.tree().unwrap();
        let base_tree = base_commit.as_ref().map_or_else(
            || find_latest_parent_in_previous_days(&current_commit).and_then(|c| c.tree().ok()),
            |c| c.tree().ok(),
        );

        debug!(
            "Generating diff for {}..{}",
            base_tree
                .as_ref()
                .map_or_else(|| String::from("None"), |t| t.id().to_string()),
            current_commit.id().to_string()
        );

        let mut diff = repo
            .diff_tree_to_tree(base_tree.as_ref(), Some(&tree), Some(&mut diff_opts))
            .unwrap();
        match diff.find_similar(Some(&mut find_opts)) {
            Ok(_) => (),
            Err(e) => {
                debug!(
                    "Unable to find similar files, continuing without rename detection: {}",
                    e
                );
            }
        }

        for delta in diff.deltas() {
            let delta_file_path = delta.new_file().path().unwrap();
            trace!("Processing delta for file: {:?}", &delta_file_path);

            file_date_map.num_of_deltas += 1;
            let file_path = &RelativePath::from_path(delta_file_path)
                .unwrap()
                .to_path(root);
            if deleted_files.contains(file_path) {
                match delta.status() {
                    Delta::Added => {
                        deleted_files.remove(file_path);
                    }
                    Delta::Renamed => {
                        deleted_files.remove(file_path);
                        let old_file_path =
                            RelativePath::from_path(delta.old_file().path().unwrap())
                                .unwrap()
                                .to_path(root);
                        deleted_files.insert(old_file_path.to_owned());
                    }
                    _ => {}
                }
                continue;
            }

            let latest_path = file_renames
                .get(file_path)
                .map_or_else(|| file_path.to_owned(), |path| path.to_owned());

            match delta.status() {
                Delta::Deleted => {
                    deleted_files.insert(latest_path);
                }
                Delta::Added => {
                    let entry = file_date_map
                        .items
                        .entry(latest_path)
                        .or_insert(FileDates::new(file_mod_time));
                    entry.created = Some(file_mod_time);
                }
                Delta::Modified => {
                    file_date_map
                        .items
                        .entry(latest_path)
                        .or_insert(FileDates::new(file_mod_time));
                }
                Delta::Renamed => {
                    let old_file_path = RelativePath::from_path(delta.old_file().path().unwrap())
                        .unwrap()
                        .to_path(root);
                    file_renames.insert(old_file_path.to_owned(), latest_path.clone());
                    file_renames.remove(file_path);

                    file_date_map
                        .items
                        .entry(latest_path)
                        .or_insert(FileDates::new(file_mod_time));
                }
                _ => continue,
            }
        }

        file_date_map.num_of_commits += 1;
        if file_date_map.num_of_commits % 30 == 0 {
            info!(
                "Git history processing in progress. {} commits and {} deltas processed so far",
                file_date_map.num_of_commits, file_date_map.num_of_deltas
            );
        }

        commit = base_commit;
    }

    file_date_map.duration_msec = start.elapsed().as_millis() as u64;

    info!(
        "Git history processing done (processed {} commits, {} deltas in {} secs)",
        file_date_map.num_of_commits,
        file_date_map.num_of_deltas,
        file_date_map.duration_msec as f32 / 1000.0
    );

    Ok(file_date_map)
}

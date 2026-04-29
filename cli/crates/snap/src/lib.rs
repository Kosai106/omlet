pub extern crate insta;
pub extern crate relative_path;

#[macro_export]
macro_rules! glob {
    ($glob:expr, $closure:expr) => {{
        use std::path::PathBuf;
        use $crate::insta::_macro_support;
        use $crate::relative_path::RelativePath;

        let file_path =
            &_macro_support::get_cargo_workspace(env!("CARGO_MANIFEST_DIR")).join(file!());
        let base = file_path
            .parent()
            .unwrap_or_else(|| panic!("Failed to get parent of {:?}", file_path));

        let abs_glob = RelativePath::new($glob).to_logical_path(base);
        let glob_root = RelativePath::new(
            String::from($glob)
                .split(&['*', '?', '[', '{'][..])
                .nth(0)
                .unwrap(),
        )
        .to_logical_path(base);

        let mut paths: Vec<PathBuf> = Vec::new();
        _macro_support::glob_exec(
            &glob_root,
            abs_glob.strip_prefix(&glob_root).unwrap().to_str().unwrap(),
            |path| paths.push(path.to_path_buf()),
        );

        // Sort paths by their string representation
        paths.sort();
        let mut settings = $crate::insta::Settings::clone_current();
        for path in paths {
            settings.set_input_file(&path);
            settings.set_snapshot_suffix(path.file_name().unwrap().to_str().unwrap());
            settings.bind(|| $closure(&path));
        }
    }};
}

pub use insta::{
    assert_debug_snapshot, assert_display_snapshot, assert_json_snapshot, assert_snapshot,
    assert_yaml_snapshot, with_settings,
};

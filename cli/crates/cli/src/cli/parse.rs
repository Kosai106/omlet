use std::path::{Path, PathBuf};
use std::rc::Rc;
use std::sync::mpsc;
use std::{fs, thread};

use git_utils::get_file_dates;
use logger::info;
use omlet::{module_resolver::ModuleResolver, parser};
use relative_path::RelativePathBuf;

pub fn run(
    input_files: &[RelativePathBuf],
    project_root: &Path,
    output_dir: &Path,
    module_resolver: &Rc<ModuleResolver>,
    git_history_limit: u64,
) {
    let (tx, rx) = mpsc::channel();
    let root = String::from(project_root.to_str().unwrap());

    thread::spawn(move || {
        let pathspec = vec!["*.[jt]sx".into(), "*.[jt]s".into()];
        let file_dates =
            get_file_dates(&PathBuf::from(root), Some(git_history_limit), &pathspec).unwrap();
        tx.send(file_dates).unwrap();
    });
    let modules: Vec<parser::Module> = input_files
        .iter()
        .map(|path| parser::Module::new(path, project_root, module_resolver).unwrap())
        .collect();

    let file_dates = rx.recv().unwrap();
    for mut module in modules {
        let module_path = module.source_path.to_path(&project_root);
        let dates = file_dates.get(&module_path);
        module.created_at = dates.and_then(|fd| fd.created);
        module.updated_at = dates.map(|fd| fd.updated);
        let yaml = serde_yaml::to_string(&module)
            .unwrap_or_else(|e| panic!("Serialization failed: {}", e));
        let file_stem = module.id.path.file_stem().unwrap();
        let mod_name = if file_stem == "index" {
            module.id.path.parent().unwrap().file_stem().unwrap()
        } else {
            file_stem
        };

        let output_file_name = format!("{}-{:x}-ast.yaml", mod_name, module.id.hash);

        info!(
            "Writing result for {} to {}",
            module_path.to_str().unwrap(),
            output_file_name
        );
        fs::write(Path::join(output_dir, output_file_name), &yaml)
            .unwrap_or_else(|e| panic!("Couldn't write output to file {}", e));
    }
}

pub fn run_on_string(snippet: &str) {
    let module = parser::Module::try_from(snippet).unwrap();
    let yaml =
        serde_yaml::to_string(&module).unwrap_or_else(|e| panic!("Serialization failed: {}", e));

    print!("{}", yaml);
}

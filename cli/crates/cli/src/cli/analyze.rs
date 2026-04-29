use std::cell::RefCell;
use std::path::{Path, PathBuf};
use std::rc::Rc;
use std::sync::mpsc;
use std::{fs, thread};

use git_utils::get_file_dates;
use logger::info;
use omlet::{
    analyzer::{Analyzer, AnalyzerResult},
    module_resolver::ModuleResolver,
    parser::Module,
};
use relative_path::RelativePathBuf;
use serde_yaml::{Error, Mapping, Value};
use utils::list_all_project_files;

fn shorten_results(results: &AnalyzerResult) -> Mapping {
    let mut result = Mapping::new();
    let mut components = results
        .components
        .iter()
        .map(|c| {
            format!(
                "{} -> {} (deps: {})",
                c.source.source.path,
                c.source.get_name(),
                c.dependencies.len()
            )
        })
        .collect::<Vec<String>>();

    components.sort();

    let mut exports = results
        .exports
        .iter()
        .map(|e| format!("{} -> {} ({})", e.module_id.path, e.name, e.is_component))
        .collect::<Vec<String>>();

    exports.sort();

    result.insert(
        Value::String("num_of_components".to_string()),
        Value::Number(components.len().into()),
    );
    result.insert(
        Value::String("components".to_string()),
        Value::Sequence(
            components
                .iter()
                .map(|c| Value::String(c.clone()))
                .collect(),
        ),
    );
    result.insert(
        Value::String("num_of_exports".to_string()),
        Value::Number(exports.len().into()),
    );
    result.insert(
        Value::String("exports".to_string()),
        Value::Sequence(exports.iter().map(|e| Value::String(e.clone())).collect()),
    );

    result
}

fn merge_results_with_stats(analyzer_result: &AnalyzerResult) -> Result<Mapping, Error> {
    let result: Value = serde_yaml::from_str(&serde_yaml::to_string(analyzer_result)?)?;
    match result {
        Value::Mapping(mut mapping) => {
            mapping.insert(
                "num_of_components".into(),
                analyzer_result.components.len().into(),
            );
            mapping.insert(
                "num_of_exports".into(),
                analyzer_result.exports.len().into(),
            );
            mapping.insert(
                "num_of_dependencies".into(),
                analyzer_result.get_num_of_dependencies().into(),
            );
            Ok(mapping)
        }
        _ => unreachable!(),
    }
}

pub fn run(
    input_files: &[RelativePathBuf],
    project_root: &Path,
    output_dir: &Path,
    module_resolver: &Rc<ModuleResolver>,
    short: bool,
    git_history_limit: u64,
) {
    let (tx, rx) = mpsc::channel();
    let root = String::from(project_root.to_str().unwrap());
    let pathspec = vec!["*.[jt]sx".into(), "*.[jt]s".into()];
    info!("Commit limit: {:?}", git_history_limit);

    thread::spawn(move || {
        let file_dates =
            get_file_dates(&PathBuf::from(root), Some(git_history_limit), &pathspec).unwrap();
        tx.send(file_dates).unwrap();
    });

    let all_files: Vec<RelativePathBuf> = list_all_project_files(&project_root).unwrap().collect();
    let mut modules: Vec<Rc<RefCell<Module>>> = vec![];
    for module_path in all_files {
        info!("Parsing file at {}", &module_path.to_string());

        modules.push(Rc::new(RefCell::new(
            Module::new(&module_path, project_root, module_resolver).unwrap(),
        )));
    }

    let file_dates = rx.recv().unwrap();
    for module in &modules {
        let mut module = module.as_ref().borrow_mut();
        let module_path = module.source_path.to_path(&project_root);
        let dates = file_dates.get(&module_path);
        module.created_at = dates.and_then(|fd| fd.created);
        module.updated_at = dates.map(|fd| fd.updated);
    }

    let mut analyzer = Analyzer::new(&modules, module_resolver, input_files.into(), true).unwrap();
    let results = analyzer.analyze();
    let yaml = if short {
        serde_yaml::to_string(&shorten_results(&results))
    } else {
        merge_results_with_stats(&results)
            .map_or_else(|error| Err(error), |v| serde_yaml::to_string(&v))
    };

    let yaml = yaml.unwrap_or_else(|e| panic!("{}", e));

    let output_file_name = "results.yaml";
    info!("Writing result to {}", output_file_name);
    fs::write(Path::join(output_dir, output_file_name), &yaml).unwrap_or_else(|e| panic!("{}", e));
}

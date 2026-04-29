use std::path::Path;
use std::rc::Rc;

use omlet::{module_resolver::ModuleResolver, parser};

use relative_path::RelativePathBuf;
use utils::{get_glob_base, get_project_root};
#[test]
fn test_parse_typescript() {
    let project_root = get_project_root(
        &get_glob_base(&String::from("../../samples/typescript/src/**/*.{tsx,ts}")).unwrap(),
    )
    .unwrap();
    let module_resolver = Rc::new(ModuleResolver::empty());

    snap::with_settings!({sort_maps => true}, {
        snap::glob!("../../../samples/typescript/src/**/*.{tsx,ts}", |path: &Path| {
            snap::assert_yaml_snapshot!(&parser::Module::new(
                &RelativePathBuf::from_path(path.strip_prefix(&project_root).unwrap()).unwrap(),
                &project_root,
                &module_resolver,
            ).unwrap())
        });
    });
}

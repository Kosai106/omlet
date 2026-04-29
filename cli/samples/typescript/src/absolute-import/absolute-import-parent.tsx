// To test the absolute path, we mock the package root's absolute path.
// In `alias-map.json`, we set "/package" as the package root.
// Therefore, "/package/src/absolute-import/absolute-import-child" means "src/absolute-import/absolute-import-child" in the package.
import {AbsoluteImportChild} from "/package/src/absolute-import/absolute-import-child";

export function AbsoluteImportParent() {
    return <div>
        <div>Parent</div>
        <AbsoluteImportChild/>
    </div>;
}

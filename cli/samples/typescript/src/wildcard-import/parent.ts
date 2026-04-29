import * as child from "./child";

export function parent() {
    return child.child();
}
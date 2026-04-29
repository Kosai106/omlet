import * as pkgInfo from "../package.json";

export function getCliVersion() {
    return pkgInfo.version;
}

export function getExecutableName() {
    return Object.keys(pkgInfo.bin)[0];
}

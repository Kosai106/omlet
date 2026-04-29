import React from "react";

export * from "./circular-export-module-A";

export function ComponentFromCircularExportModuleB() {
    return <img/>
}

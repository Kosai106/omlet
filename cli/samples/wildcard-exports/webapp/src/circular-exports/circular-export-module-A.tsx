import React from "react";

export * from "./circular-export-module-B";

export function ComponentFromCircularExportModuleA() {
    return <img/>
}

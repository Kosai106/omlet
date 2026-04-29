import React from "react";
import * as LocalDS from "./ds";
import { ds } from "./re-export";
import * as DS from "ds";
import * as ModuleWithDefaultExport from "./export-default";

export function WildcardImport() {
    return (
        <>
            <ds.Button />
            <LocalDS.Button />
            <DS.Button/>
            <ModuleWithDefaultExport.default />
        </>
    );
}

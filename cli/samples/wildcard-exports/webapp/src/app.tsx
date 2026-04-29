import React from "react"
import { MainForm, RightPanel, SearchBar } from "./components";
import { Input } from "@wildcard-exports/design-system-input";
import { ComponentFromCircularExportModuleA, ComponentFromCircularExportModuleB, ComponentFromCircularExportModuleC } from "./circular-exports";

export function App() {
    return <div>
        <h1>app</h1>
        <RightPanel/>
        <MainForm/>
        <SearchBar/>
        <Input/>
        <ComponentFromCircularExportModuleA/>
        <ComponentFromCircularExportModuleB/>
        <ComponentFromCircularExportModuleC />
    </div>;
}

import DefaultExportComponent from "./defaultExport";


const ds = {
    DefaultExportComponent
}

export function ParentComponent() {
    return (
        <>
            <ds.DefaultExportComponent prop="indirect-usage" />
        </>
    );
}

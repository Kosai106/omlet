import AnonFuncIndex from "./default-export-anon-func-index";
import NamedFuncIndex from "./default-export-named-func-index";
import ReExported from "./default-export-reexport/default-export-reexport";
import AnonExprWrapped from "./default-export-anon-expr-wrapped";
import AnonFunc from "./default-export-anon-func";
import DefaultOfDoubleExport, { NamedComponentDoubleExport } from "./default-export-default-and-named";
import NamedFunc from "./default-export-named-func";
import NamedVarDecl from "./default-export-named-var-decl";
import ThirdPartyDefaultExport from "@acme/button-component";

export function DefaultExportMain() {
    return (
        <>
            <AnonFuncIndex/>
            <NamedFuncIndex/>
            <ReExported/>
            <AnonExprWrapped/>
            <AnonFunc/>
            <DefaultOfDoubleExport/>
            <NamedComponentDoubleExport/>
            <NamedFunc/>
            <NamedVarDecl/>
            <ThirdPartyDefaultExport/>
        </>
    );
}

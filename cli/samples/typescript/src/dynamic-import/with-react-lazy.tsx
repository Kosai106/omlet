import { lazy } from "react";

const ImportedComponent = lazy(() => import("./imported-component"));

export function WithReactLazy() {
    return (
        <>
            <ImportedComponent/>
            <div>some sync jsx code</div>
        </>
    );
}

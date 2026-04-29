import dynamic from "next/dynamic";

import LoadingComponent from "./loading-component";

const ImportedComponent = dynamic(
    () => import("./imported-component"),
    {
        loading: () => <LoadingComponent/>,
    }
);
const ImportedNamedComponent = dynamic(
    async () => {
        const { NamedComponent } = await import("./named-component");
        return NamedComponent;
    },
    {
        loading: () => <LoadingComponent/>,
    }
);

export function WithNextDynamic() {
    return (
        <>
            <ImportedComponent/>
            <ImportedNamedComponent/>
            <div>some sync jsx code</div>
        </>
    );
}

import { useState, useEffect } from "react";

export function AwaitImportAndUseInJsx() {
    const [node, setNode] = useState(<div>loading</div>);

    useEffect(() => {
        async function fetchNode() {
            const {ImportedComponent} = await import("ds");
            setNode(<ImportedComponent/>);
        }

        fetchNode();
    }, []);

    return (
        <>
            {node}
            <div>some sync jsx code</div>
        </>
    );
}

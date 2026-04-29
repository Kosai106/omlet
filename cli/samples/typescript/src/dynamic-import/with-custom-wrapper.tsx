function lazyComponent(callback) {
    return callback().default;
}

const ImportedComponent = lazyComponent(() => import("./imported-component"));

export function WithCustomWrapper() {
    return (
        <>
            <ImportedComponent/>
            <div>some sync jsx code</div>
        </>
    );
}

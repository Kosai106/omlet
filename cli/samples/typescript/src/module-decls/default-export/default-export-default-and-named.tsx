export function NamedComponentDoubleExport() {
    return <div></div>;
}

export function ComponentUsingNamedComponentDoubleExport() {
    return <NamedComponentDoubleExport/>;
}

export default NamedComponentDoubleExport;


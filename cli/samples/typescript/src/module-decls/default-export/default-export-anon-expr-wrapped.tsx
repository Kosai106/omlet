
function withRouter(comp) {
    return comp;
}

export function ComponentUsingNamedWrappedComponent() {
    return <NamedComponentWrapped/>;
}

export function NamedComponentWrapped() {
    return <div></div>;
}

export default withRouter(NamedComponentWrapped);


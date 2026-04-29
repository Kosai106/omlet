import * as DS from "./ds";


export function LinkOrButton({ link }) {
    const Component = link ? DS.Link : DS.Button;

    return <Component />;
}
export function Parent() {
    return (
        <LinkOrButton />
    );
}

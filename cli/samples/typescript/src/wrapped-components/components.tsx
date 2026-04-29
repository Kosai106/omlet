import { ComponentWithIntl } from "./wrapped-components";

export function WrappedComponent() {
    return <div></div>;
}

export function PlainComponent() {
    return <div>
        <ComponentWithIntl/>
    </div>;
}

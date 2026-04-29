export function withWrapperJsx(Component) {
    return () => <div><Component/></div>;
}

export function withWrapperNoJsx(Component) {
    return () => Component;
}

export function withClassWrapperJsx(WrappedComponent) {
    return class extends WrappedComponent {

        render() {
            return <div><WrappedComponent/></div>;
        }
    };
}

export function withClassWrapperNoJsx(WrappedComponent) {
    return class extends WrappedComponent {
    };
}

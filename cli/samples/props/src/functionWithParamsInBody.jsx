export function DestructInBody(props) {
    const {
        position: {
            x,
            y,
        },
        type = "primary",
        text,
        onClick,
    } = props;
    return (
        <button
            className={type === "primary" ? "button primary" : "button secondary"}
            onClick={onClick}>
            {text}
        </button>
    );
}

export function MemberInBody(props) {
    return (
        <button
            className={props.type === "primary" ? "button primary" : "button secondary"}
            onClick={props.onClick}>
            {props.text}
        </button>
    );
}
export function ComponentWithRest({
     position: {
         x,
         y,
     },
    ...props
}) {
    return (
        <button
            className={props.type === "primary" ? "button primary" : "button secondary"}
            onClick={props.onClick}>
            {props.text}
        </button>
    );
}
export function MultipleDestruct(props) {
    const { type = "primary", onClick } = props;
    const { type: foo, onClick: bar = () => {} } = props;
    return (
        <button
            className={type === "primary" ? "button primary" : "button secondary"}
            onClick={onClick}>
            {props.text}
        </button>
    );
}

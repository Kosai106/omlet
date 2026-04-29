export function Button({
    position: {
       x,
       y,
    },
    type = "primary",
    text,
    onClick,
}) {
    return (
        <button
            className={type === "primary" ? "button primary" : "button secondary"}
            onClick={onClick}>
            {text}
        </button>
    );
}

export const ButtonWithArrowFunction = ({
    position: {
        x,
        y,
    },
    type = "primary",
    text,
    onClick,
}) =>  (
    <button
        className={type === "primary" ? "button primary" : "button secondary"}
        onClick={onClick}>
        {text}
    </button>
);

export const ButtonWithFunctionExpression = function ({
    position: {
      x,
      y,
    },
    type = "primary",
    text,
    onClick,
}) {
    return (
        <button
            className={type === "primary" ? "button primary" : "button secondary"}
            onClick={onClick}>
            {text}
        </button>
    );
}

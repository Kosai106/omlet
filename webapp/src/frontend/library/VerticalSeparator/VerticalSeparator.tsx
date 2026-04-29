import classNames from "classnames";

import classes from "./VerticalSeparator.module.css";

export enum VerticalSeparatorKind {
    Decorative,
    Informative,
    Warning,
    Critical,
}

interface Props {
    kind: VerticalSeparatorKind;
    className?: string;
}

export function VerticalSeparator({ kind, className }: Props) {
    const cls = classNames(
        classes.verticalSeparator,
        {
            [classes.decorative]: kind === VerticalSeparatorKind.Decorative,
            [classes.informative]: kind === VerticalSeparatorKind.Informative,
            [classes.warning]: kind === VerticalSeparatorKind.Warning,
            [classes.critical]: kind === VerticalSeparatorKind.Critical,
        },
        className
    );
    return <div className={cls}/>;
}

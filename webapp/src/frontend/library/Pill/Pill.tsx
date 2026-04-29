import { type PropsWithChildren } from "react";

import classNames from "classnames";

import classes from "./Pill.module.css";


export enum PillKind {
    Default,
    Critical,
}

interface Props {
    className?: string;
    kind?: PillKind;
}

export function Pill({
    className,
    kind = PillKind.Default,
    children,
}: PropsWithChildren<Props>) {
    const cls = classNames(classes.pill, { [classes.critical]: kind === PillKind.Critical }, className);
    return <span className={cls}>{children}</span>;
}

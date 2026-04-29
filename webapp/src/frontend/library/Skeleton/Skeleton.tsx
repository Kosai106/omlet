import classNames from "classnames";

import classes from "./Skeleton.module.css";

interface Props {
    className?: string;
}
export function Skeleton({ className }: Props) {
    return (
        <div className={classNames(classes.skeleton, className)} />
    );
}

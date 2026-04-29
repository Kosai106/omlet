import { type MouseEventHandler } from "react";

import classNames from "classnames";

import classes from "./AddTagButton.module.css";

interface Props {
    className?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
}
export function AddTagButton({
    className,
    onClick,
}: Props) {
    return (
        <button className={classNames(classes.addTagButton, className)} onClick={onClick}>
            + Add Tag
        </button>
    );
}

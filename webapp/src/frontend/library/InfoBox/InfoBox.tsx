import { type ReactNode } from "react";

import classNames from "classnames";

import { IconCancelWithContainer } from "../icons/IconCancelWithContainer";

import classes from "./InfoBox.module.css";

interface Props {
    className?: string;
    children: ReactNode;
    onClose?(): void;
}

export function InfoBox({ className, children, onClose }: Props) {
    return (
        <div className={classNames(classes.infoBox, className)}>
            {children}
            {onClose && (
                <button
                    className={classes.closeButton}
                    type="button"
                    onClick={onClose}>
                    <IconCancelWithContainer/>
                </button>
            )}
        </div>
    );
}

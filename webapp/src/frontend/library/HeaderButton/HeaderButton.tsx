import { type ReactNode, forwardRef } from "react";

import classNames from "classnames";

import { IconWarning } from "../icons/IconWarning";

import classes from "./HeaderButton.module.css";

interface ButtonProps {
    active?: boolean;
    icon?: ReactNode;
    label: string;
    form?: string;
    disabled?: boolean;
    onClick(): void;
}

export const HeaderButton = forwardRef<HTMLButtonElement, ButtonProps>((
    {
        active = false,
        icon,
        label,
        form,
        disabled = false,
        onClick,
    },
    buttonRef,
) => {
    const clss = classNames(classes.headerButton, {
        [classes.active]: active,
    });

    return (
        <button
            ref={buttonRef}
            type="button"
            className={clss}
            form={form}
            disabled={disabled}
            onClick={onClick}>
            {icon}
            {label && <span className={classes.label}>{label}</span>}
        </button>
    );
});

export enum HighlightButtonKind {
    Default,
    Warning,
    Critical,
}

interface HighlightButtonProps extends Omit<ButtonProps, "icon"> {
    kind: HighlightButtonKind;
}

export const HeaderHighlightButton = forwardRef<HTMLButtonElement, HighlightButtonProps>((
    {
        kind = HighlightButtonKind.Default,
        active = false,
        label,
        form,
        onClick,
    },
    buttonRef,
) => {
    const cls = classNames(classes.headerHighlightButton, {
        [classes.warning]: kind === HighlightButtonKind.Warning,
        [classes.critical]: kind === HighlightButtonKind.Critical,
        [classes.active]: active,
    });

    return (
        <button
            ref={buttonRef}
            type="button"
            form={form}
            className={cls}
            onClick={onClick}>
            {kind === HighlightButtonKind.Warning && <IconWarning/>}
            <span className={classes.label}>{label}</span>
        </button>
    );
});

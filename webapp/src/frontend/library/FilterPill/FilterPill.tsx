import { forwardRef, type PropsWithChildren } from "react";

import classNames from "classnames";

import classes from "./FilterPill.module.css";

interface Props {
    active?: boolean;
    onClick?(): void;
}

export const FilterPill = forwardRef<HTMLButtonElement, PropsWithChildren<Props>>((
    {
        children,
        active = false,
        onClick,
    },
    buttonRef,
) => {
    const cls = classNames(classes.filterPill, {
        [classes.active]: active,
    });

    return (
        <button
            ref={buttonRef}
            className={cls}
            type="button"
            onClick={onClick}>
            {children}
        </button>
    );
});

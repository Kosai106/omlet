import { forwardRef } from "react";

import classNames from "classnames";

import classes from "./LandingPageButton.module.css";

export enum LandingPageButtonKind {
    Primary = "primary",
    Secondary = "secondary",
}

interface Props {
    className?: string;
    kind?: LandingPageButtonKind;
    label: string;
    onClick(): void;
}

export const LandingPageButton = forwardRef<HTMLButtonElement, Props>((
    {
        className,
        kind = LandingPageButtonKind.Primary,
        label,
        onClick,
    },
    ref,
) => {
    const cls = classNames(classes.landingPageButton, { [classes.secondary]: kind === LandingPageButtonKind.Secondary }, className);

    return (
        <button
            type="button"
            className={cls}
            onClick={onClick} ref={ref}>
            {label}
        </button>
    );
});

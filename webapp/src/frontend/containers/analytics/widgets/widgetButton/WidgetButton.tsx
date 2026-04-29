import { type ReactNode } from "react";

import { IconAdd } from "../../../../library/icons/IconAdd";

import classes from "./WidgetButton.module.css";

interface Props {
    children: ReactNode;
    disabled?: boolean;
    onClick(): void;
}

export function WidgetButton({
    children,
    disabled = false,
    onClick,
}: Props) {
    return (
        <button
            type="button"
            className={classes.widgetButton}
            disabled={disabled}
            onClick={onClick}>
            <div className={classes.icon}>
                <IconAdd/>
            </div>
            {children}
        </button>
    );
}

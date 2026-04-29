import { type PropsWithChildren } from "react";

import classes from "./Badge.module.css";

interface Props {
    value?: number;
}

export function Badge({ children, value }: PropsWithChildren<Props>) {
    return (
        <div className={classes.badgeContainer}>
            {value !== undefined && value > 0 && <div className={classes.badge}>{value}</div>}
            {children}
        </div>
    );
}

import { type ReactNode, type PropsWithChildren } from "react";

import classNames from "classnames";

import classes from "./DashboardSection.module.css";

interface Props {
    className?: string;
    header: ReactNode;
}

export function DashboardSection({
    className,
    header,
    children,
}: PropsWithChildren<Props>) {
    return (
        <section className={classNames(classes.dashboardSection, className)}>
            {header}
            <div className={classes.charts}>
                {children}
            </div>
        </section>
    );
}

function Separator() {
    return (
        <hr className={classes.separator}/>
    );
}

DashboardSection.Separator = Separator;

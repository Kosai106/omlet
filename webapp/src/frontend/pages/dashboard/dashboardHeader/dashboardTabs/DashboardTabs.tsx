import classNames from "classnames";
import { type LinkProps, NavLink } from "react-router-dom";

import { IconBookmark } from "../../../../library/icons/IconBookmark";
import { IconCharts } from "../../../../library/icons/IconCharts";

import classes from "./DashboardTabs.module.css";

function DashboardTab({ children, to, ...props }: LinkProps) {
    return (
        <NavLink
            className={({ isActive }) => classNames(classes.dashboardTab, { [classes.selected]: isActive })}
            to={to}
            end
            {...props}>
            {children}
            <div className={classes.indicator}/>
        </NavLink>
    );
}

export function DashboardTabs() {
    return (
        <nav className={classes.dashboardTabs}>
            <DashboardTab to=""><IconCharts/>Popular Charts</DashboardTab>
            <DashboardTab to="saved-charts"><IconBookmark/>Saved Dashboard</DashboardTab>
        </nav>
    );
}

import classNames from "classnames";
import { type LinkProps, NavLink } from "react-router-dom";

import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import classes from "./Tabs.module.css";

function Tab({ children, to, ...props }: LinkProps) {
    return (
        <NavLink
            className={({ isActive }) => classNames(classes.tab, { [classes.selected]: isActive })}
            to={to}
            {...props}>
            {children}
        </NavLink>
    );
}

export function Tabs() {
    const { selectors: { getAnalyticsURL, getComponentsURL } } = useStore();

    return (
        <nav className={classes.tabs}>
            <Tab to={getAnalyticsURL()}>Analytics</Tab>
            <Tab to={getComponentsURL()}>Components</Tab>
        </nav>
    );
}

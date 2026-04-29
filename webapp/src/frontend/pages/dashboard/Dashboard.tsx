import classNames from "classnames";
import { Outlet } from "react-router-dom";

import { AccessLevel } from "../../models/AccessLevel";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

import { DashboardHeader } from "./dashboardHeader/DashboardHeader";

import classes from "./Dashboard.module.css";

export function Dashboard() {
    const { selectors: { getAccessLevel } } = useStore();

    const accessLevel = getAccessLevel();

    return (
        <div className={classNames(classes.dashboard, { [classes.sharedPage]: accessLevel === AccessLevel.Page })}>
            {accessLevel !== AccessLevel.Page && <DashboardHeader/>}
            <Outlet/>
        </div>
    );
}

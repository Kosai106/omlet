import { type ReactNode } from "react";

import classNames from "classnames";
import { Link, useLocation } from "react-router-dom";

import classes from "./Tabs.module.css";

interface Props {
    items: {
        key: string;
        label: ReactNode;
        content: ReactNode;
    }[];
    activeTab: string;
}
export function Tabs({ activeTab, items }: Props) {
    const { pathname, search } = useLocation();
    const activeItem = items.find(({ key }) => key === activeTab) ?? items[0];

    return (
        <div className={classes.tabs}>
            <nav className={classes.nav}>
                {items.map(({ key, label }) => {
                    return (
                        <Link
                            key={key}
                            to={{ pathname: `${pathname.split("/").slice(0, 4).join("/")}/${key}`, search }}
                            className={classNames(classes.link, { [classes.active]: key === activeItem.key })}>
                            {label}
                        </Link>
                    );
                })}
                {items.map(({ key }) => <div key={key} className={classNames(classes.bar, { [classes.active]: key === activeItem.key })} />)}
                <div className={classes.mainBar} />
            </nav>
            {activeItem.content}
        </div>
    );
}

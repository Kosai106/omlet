import { type ReactNode } from "react";

import classNames from "classnames";
import { Link } from "react-router-dom";

import { H1 } from "../../../library/Heading/Heading";

import classes from "./DashboardSectionHeader.module.css";

interface Props {
    className?: string;
    link?: string;
    title: ReactNode;
    description: ReactNode;
    rightContent?: ReactNode;
}

export function DashboardSectionHeader({
    className,
    link,
    title,
    description,
    rightContent,
}: Props) {
    function renderContent() {
        const content = (
            <>
                <H1>{title}</H1>
                <p className={classes.description}>
                    {description}
                </p>
            </>
        );

        if (link) {
            return <Link className={classes.leftContent} to={link}>{content}</Link>;
        }

        return <div className={classes.leftContent}>{content}</div>;
    }

    return (
        <header className={classNames(classes.dashboardSectionHeader, className)}>
            {renderContent()}
            {rightContent}
        </header>
    );
}

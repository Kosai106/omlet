import { type PropsWithChildren, type ReactNode } from "react";

import classNames from "classnames";

import { H2 } from "../../../library/Heading/Heading";

import classes from "./OnboardingStepCard.module.css";

interface Props {
    title: ReactNode;
    active?: boolean;
    onTitleClick?(): void;
}

export function OnboardingStepCard({
    title,
    children,
    active = false,
    onTitleClick,
}: PropsWithChildren<Props>) {
    return (
        <div className={classNames(classes.onboardingStepCard, { [classes.active]: active })}>
            <H2 className={classNames(classes.title, { [classes.canClick]: onTitleClick })} onClick={onTitleClick}>{title}</H2>
            {active && children}
        </div>
    );
}

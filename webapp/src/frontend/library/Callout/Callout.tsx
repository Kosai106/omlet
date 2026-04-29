import { type ReactNode, type PropsWithChildren } from "react";

import classNames from "classnames";
import { type Emoji } from "emoji-type";

import { H3 } from "../Heading/Heading";
import { IconCancelWithContainer } from "../icons/IconCancelWithContainer";

import classes from "./Callout.module.css";

export enum CalloutKind {
    Default,
    Onboarding,
    Critical,
}

export enum CalloutSize {
    Default,
    Large,
}

interface Props {
    kind?: CalloutKind;
    size?: CalloutSize;
    emoji?: Emoji;
    className?: string;
    header?: string;
    action?: ReactNode;
    onDismiss?: () => void;
}
export function Callout({
    kind = CalloutKind.Default,
    size = CalloutSize.Default,
    emoji,
    className,
    header,
    children,
    action,
    onDismiss,
}: PropsWithChildren<Props>) {
    const cls = classNames(
        classes.callout,
        {
            [classes.onboarding]: kind === CalloutKind.Onboarding,
            [classes.critical]: kind === CalloutKind.Critical,
            [classes.large]: size === CalloutSize.Large,
        },
        className
    );

    return (
        <div className={cls}>
            {onDismiss && (
                <button className={classes.dismissButton} onClick={onDismiss}>
                    <IconCancelWithContainer/>
                </button>
            )}
            {emoji && <div className={classes.emoji}>{emoji}</div>}
            <div className={classes.column}>
                {header && <H3 className={classes.header}>{header}</H3>}
                <div className={classes.content}>{children}</div>
                {action && <div className={classes.action}>{action}</div>}
            </div>
        </div>
    );
}

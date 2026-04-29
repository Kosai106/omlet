import { type DetailedHTMLProps, type HTMLAttributes } from "react";

import classNames from "classnames";

import classes from "./Heading.module.css";

export function H1({ className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) {
    return <h1 className={classNames(classes.h1, className)} {...props}/>;
}

export function H2({ className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) {
    return <h2 className={classNames(classes.h2, className)} {...props}/>;
}

export function H3({ className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) {
    return <h3 className={classNames(classes.h3, className)} {...props}/>;
}

export function H4({ className, ...props }: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>) {
    return <h4 className={classNames(classes.h4, className)} {...props}/>;
}

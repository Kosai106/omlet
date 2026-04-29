import { type PropsWithChildren } from "react";

import classNames from "classnames";

import { VerticalSeparatorKind, VerticalSeparator } from "../../library/VerticalSeparator/VerticalSeparator";

import classes from "./Quote.module.css";

type QuoteKind = VerticalSeparatorKind;

interface Props {
    className?: string;
    kind: QuoteKind;
}

export function Quote({ kind, children, className }: PropsWithChildren<Props>) {
    return (
        <div className={classNames(classes.quote, className)}>
            <VerticalSeparator kind={kind} />
            {children}
        </div>
    );
}

export { VerticalSeparatorKind as QuoteKind };

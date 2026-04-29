import { useEffect, useMemo, useRef, useState } from "react";

import classNames from "classnames";

import { Tooltip } from "../../../library/Tooltip/Tooltip";
import { generateGetTextWidthFromRef } from "../../../utils";

import classes from "./TruncateEnd.module.css";

interface Props {
    className?: string;
    content: string;
}

export function TruncateEnd({ className, content }: Props) {
    const contentRef = useRef<HTMLSpanElement>(null);
    const [isClamped, setIsClamped] = useState(false);
    const getTextWidth = useMemo(() => generateGetTextWidthFromRef(contentRef), [contentRef.current]);

    useEffect(() => {
        if (!contentRef.current) {
            return;
        }

        setIsClamped(contentRef.current.clientWidth < getTextWidth(content));
    }, [content, contentRef.current]);

    return (
        <Tooltip content={isClamped ? content : undefined}>
            <span
                ref={contentRef}
                className={classNames(classes.truncateEnd, className)}>
                {content}
            </span>
        </Tooltip>
    );
}

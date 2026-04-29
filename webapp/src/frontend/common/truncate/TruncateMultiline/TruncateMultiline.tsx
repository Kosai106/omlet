import { useEffect, useRef, useState } from "react";

import classNames from "classnames";

import { uppercaseFirst } from "../../../../common/utils";
import { useToast } from "../../../library/Toast/Toast";
import { Tooltip } from "../../../library/Tooltip/Tooltip";

import classes from "./TruncateMultiline.module.css";

interface Props {
    className?: string;
    maxLines: number;
    content: string;
    contentName?: string;
}

export function TruncateMultiline({ className, maxLines, content, contentName = "" }: Props) {
    const contentRef = useRef<HTMLSpanElement>(null);
    const [isClamped, setIsClamped] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!contentRef.current) {
            return;
        }

        const contentStyles = window.getComputedStyle(contentRef.current);

        const referenceSpan = document.createElement("span");
        referenceSpan.textContent = content;

        referenceSpan.style.display = "inline-block";
        referenceSpan.style.visibility = "hidden";
        referenceSpan.style.fontFamily = contentStyles.fontFamily;
        referenceSpan.style.fontSize = contentStyles.fontSize;
        referenceSpan.style.lineHeight = contentStyles.lineHeight;
        referenceSpan.style.fontWeight = contentStyles.fontWeight;
        referenceSpan.style.letterSpacing = contentStyles.letterSpacing;
        referenceSpan.style.overflowWrap = contentStyles.overflowWrap;
        referenceSpan.style.width = contentStyles.width;

        document.body.append(referenceSpan);

        setIsClamped(contentRef.current.clientHeight < referenceSpan.clientHeight);

        referenceSpan.remove();
    }, [maxLines, content, contentRef.current]);

    function handleCopyContent() {
        window.navigator.clipboard.writeText(content);

        const toastMessage = [contentName, "copied to clipboard!"].join(" ").trim();
        toast.show(uppercaseFirst(toastMessage));
    }

    return (
        <Tooltip content={isClamped ? content : undefined}>
            <span
                ref={contentRef}
                className={classNames(classes.truncateMultiline, className)}
                style={{ WebkitLineClamp: maxLines }}
                onClick={handleCopyContent}>
                {content}
            </span>
        </Tooltip>
    );
}

import {
    type ClipboardEvent,
    type ReactNode,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    createElement,
} from "react";

import classNames from "classnames";

import { type TooltipProps, Tooltip } from "../../library/Tooltip/Tooltip";
import { generateGetTextWidthFromRef } from "../../utils";

import classes from "./withTruncate.module.css";

export enum SpanType {
    HTML,
    SVG,
}

export interface TruncateOptions {
    originalText: string;
    ellipsis: string;
    width: number;
    getTextWidth: (text: string) => number;
}

interface Props {
    text: string;
    className?: string;
    ellipsis?: string;
    width?: number;
    spanType?: SpanType;
    tooltipProps?: TooltipProps;
}

export function truncateComponentGenerator(getTruncatedText: (options: TruncateOptions) => string, getTooltip: (originalText: string) => ReactNode = t => t) {
    return function ({
        text: originalText,
        className,
        ellipsis = "…",
        width,
        spanType = SpanType.HTML,
        tooltipProps,
    }: Props) {
        const ref = useRef<HTMLSpanElement | SVGTSpanElement>(null);
        const tooltip = useMemo(() => getTooltip(originalText), [originalText]);
        const [truncatedText, setTruncatedText] = useState(originalText);
        const clipped = truncatedText !== originalText;

        function handleCopy(e: ClipboardEvent<HTMLSpanElement | SVGTSpanElement>) {
            e.preventDefault();
            e.clipboardData.setData("text/plain", originalText);
        }

        useLayoutEffect(() => {
            if (width !== undefined) {
                setTruncatedText(getTruncatedText({ originalText, ellipsis, width, getTextWidth: generateGetTextWidthFromRef(ref) }));
                return;
            }

            if (!ref.current) {
                return;
            }

            const observer = new ResizeObserver(() => {
                const width = ref.current?.getBoundingClientRect().width ?? 0;
                setTruncatedText(getTruncatedText({ originalText, ellipsis, width, getTextWidth: generateGetTextWidthFromRef(ref) }));
            });
            observer.observe(ref.current);
            return () => observer.disconnect();
        }, [ref, originalText, ellipsis, width]);

        return (
            <Tooltip content={clipped ? tooltip : undefined} {...tooltipProps}>
                {
                    createElement(
                        spanType === SpanType.HTML ? "span" : "tspan",
                        {
                            className: classNames(classes.truncate, className),
                            ref,
                            onCopy: handleCopy,
                        },
                        truncatedText
                    )
                }
            </Tooltip>
        );
    };
}

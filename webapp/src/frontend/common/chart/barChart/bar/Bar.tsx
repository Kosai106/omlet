import { type CSSProperties, type HTMLAttributes, type MouseEvent, type RefObject, useMemo, useEffect, useRef, useState, forwardRef } from "react";

import classNames from "classnames";
import { type To, Link } from "react-router-dom";

import { CHART_COLORS } from "../../../../../common/colorUtils";
import { type ChartValue } from "../../../../../common/models/ChartValue";
import { type Tag } from "../../../../../common/models/Tag";
import { IconQuestion } from "../../../../library/icons/IconQuestion";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";
import { generateGetTextWidthFromRef } from "../../../../utils";
import { TruncateFromMiddle } from "../../../truncate/TruncateFromMiddle";
import { BarChartTooltip } from "../../chartTooltip/BarChartTooltip";
import { ChartType } from "../../ChartType";
import { ChartMode } from "../ChartMode";

import classes from "./Bar.module.css";

const RECT_PADDING = 4;

interface BarRectOuterProps {
    link?: To;
}

const BarRectOuter = forwardRef<HTMLElement, BarRectOuterProps & HTMLAttributes<HTMLElement>>(({ link, ...props }, ref) => {
    return link
        ? <Link to={link} ref={ref as RefObject<HTMLAnchorElement>} {...props}/>
        : <div ref={ref as RefObject<HTMLDivElement>} {...props}/>;
});

interface BarRectProps {
    mode: ChartMode;
    maxValue: number;
    maxLength: number;
    valueSum: number;
    value: number;
    name: string;
    link?: To;
    color?: string;
    extra?: string;
    tags: string[];
    tagMap: Record<string, Tag>;
    displayTooltip?: boolean;
    hasBreakdown: boolean;
}

function BarRect({
    mode,
    maxValue,
    maxLength,
    valueSum,
    value,
    name,
    link,
    color = CHART_COLORS[0],
    extra,
    tags,
    tagMap,
    displayTooltip,
    hasBreakdown,
}: BarRectProps) {
    const barRef = useRef<HTMLElement>(null);
    const resizeObserverRef = useRef<ResizeObserver>();
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; } | null>(null);
    const [rectValue, setRectValue] = useState(getFormattedValue());
    const getTextWidth = useMemo(() => generateGetTextWidthFromRef(barRef), [barRef.current]);

    function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
        setTooltipPosition({ x: event.pageX, y: event.pageY });
    }

    function handleMouseLeave() {
        setTooltipPosition(null);
    }

    function handleScroll() {
        setTooltipPosition(null);
    }

    function getFormattedValue() {
        if (mode === ChartMode.Absolute) {
            return value > 0 ? value.toString() : "";
        }
        if (mode === ChartMode.Percentage) {
            const percentage = 100 * value / valueSum;
            if (percentage < 1) {
                return "< 1%";
            }
            if (percentage >= 99.5 && percentage < 100) {
                return ("99%");
            }
            return `${Math.round(percentage)}%`;
        }
        return name;

    }

    useEffect(() => {
        if (displayTooltip && tooltipPosition) {
            document.addEventListener("scroll", handleScroll, { passive: true, once: true, capture: true });
        } else {
            document.removeEventListener("scroll", handleScroll, { capture: true });
        }

        return () => {
            document.removeEventListener("scroll", handleScroll, { capture: true });
        };
    }, [displayTooltip, tooltipPosition === null]);

    useEffect(() => {
        if (barRef.current) {
            resizeObserverRef.current = new ResizeObserver(entries => {
                for (const entry of entries) {
                    let maxTextWidth: number;
                    if (entry.borderBoxSize) {
                        const borderBoxSize = Array.isArray(entry.borderBoxSize)
                            ? entry.borderBoxSize[0] as ResizeObserverSize
                            : entry.borderBoxSize as unknown as ResizeObserverSize;

                        maxTextWidth = borderBoxSize.inlineSize - 2 * RECT_PADDING;
                    } else {
                        maxTextWidth = entry.contentRect.width - (rectValue ? 0 : 2 * RECT_PADDING);
                    }

                    const formattedValue = getFormattedValue();
                    setRectValue(maxTextWidth > getTextWidth(formattedValue) ? formattedValue : "");
                }
            });

            resizeObserverRef.current.observe(barRef.current);
        } else {
            resizeObserverRef.current?.disconnect();
        }

        return () => {
            resizeObserverRef.current?.disconnect();
        };
    }, [barRef.current, rectValue]);

    const rectStyle: CSSProperties = { backgroundColor: color };

    if (mode === ChartMode.Absolute) {
        rectStyle.flexBasis = `${100 * value / maxValue}%`;
    } else if (mode === ChartMode.Percentage) {
        rectStyle.flexBasis = `${100 * value / valueSum}%`;
    } else {
        rectStyle.width = `${100 / maxLength}%`;
    }

    if (rectValue) {
        rectStyle.paddingLeft = RECT_PADDING;
        rectStyle.paddingRight = RECT_PADDING;
    }

    return (
        <>
            <BarRectOuter
                ref={barRef}
                link={link}
                className={classes.barRect}
                style={rectStyle}
                onMouseMove={displayTooltip ? handleMouseMove : undefined}
                onMouseLeave={displayTooltip ? handleMouseLeave : undefined}>
                <span className={classes.rectValue}>{rectValue}</span>
                {tooltipPosition && (
                    <BarChartTooltip
                        x={tooltipPosition.x}
                        y={tooltipPosition.y}
                        color={color}
                        title={name}
                        subtitle={extra}
                        value={value}
                        valueSum={mode === ChartMode.Absolute ? undefined : valueSum}
                        tags={tags}
                        tagMap={tagMap}/>
                )}
            </BarRectOuter>
            {!hasBreakdown && !rectValue && <span className={classes.label}>{getFormattedValue()}</span>}
        </>
    );
}

const INFO_TOOLTIP_ICON_OFFSET = 20;
interface BarLabelProps {
    label: string;
    infoTooltip?: string;
    link?: To;
    className?: string;
    onClick?: () => void;
}
function BarLabel({
    label,
    link,
    infoTooltip,
    className,
    onClick,
}: BarLabelProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(()=> {
        if (!ref.current) {
            return;
        }
        setWidth(ref.current.clientWidth - (infoTooltip ? INFO_TOOLTIP_ICON_OFFSET : 0));

        const observer = new ResizeObserver(() => {
            if (!ref.current) {
                return;
            }
            setWidth(ref.current.clientWidth - (infoTooltip ? INFO_TOOLTIP_ICON_OFFSET : 0));
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref]);

    const content = (
        <>
            <TruncateFromMiddle width={width} text={label}/>
            {infoTooltip && (
                <Tooltip content={infoTooltip}>
                    <IconQuestion/>
                </Tooltip>
            )}
        </>
    );
    if (link) {
        return (
            <Link to={link} className={classNames(classes.barLabel, className)} onClick={onClick}>
                <div className={classes.inner} ref={ref}>
                    {content}
                </div>
            </Link>
        );
    }
    return (
        <div className={classNames(classes.barLabel, className)} ref={ref} onClick={onClick}>
            <div className={classes.inner} ref={ref}>
                {content}
            </div>
        </div>
    );
}

interface Props {
    labelClassName?: string;
    link?: To;
    type?: ChartType;
    mode: ChartMode;
    maxValue: number;
    maxLength: number;
    hasBreakdown: boolean;
    label: string;
    values: ChartValue[];
    colorMap: Record<string, string>;
    tagMap: Record<string, Tag>;
    linksDisabled?: boolean;
    infoTooltip?: string;
    displayTooltip?: boolean;
}

export function Bar({
    labelClassName,
    link,
    type,
    mode,
    maxValue,
    maxLength,
    hasBreakdown,
    label,
    values,
    colorMap,
    tagMap,
    linksDisabled = false,
    infoTooltip,
    displayTooltip,
}: Props) {
    const valueSum = values.reduce((sum, { value }) => sum + value, 0);
    return (
        <div className={classNames(classes.bar, { [classes.small]: type === ChartType.Small })}>
            <BarLabel
                className={labelClassName}
                link={linksDisabled ? undefined : link}
                label={label}
                infoTooltip={infoTooltip}/>
            <div className={classes.barValue}>
                {values.map(({ id, name, value, color, extra, tags = [], link: barLink }) =>
                    <BarRect
                        key={`${label}-${id}-${name}-${value}`}
                        mode={mode}
                        maxValue={maxValue}
                        maxLength={maxLength}
                        valueSum={valueSum}
                        value={value}
                        name={hasBreakdown ? name : label}
                        link={linksDisabled ? undefined : barLink}
                        color={color ?? colorMap[id]}
                        extra={extra}
                        tags={tags}
                        tagMap={tagMap}
                        displayTooltip={displayTooltip}
                        hasBreakdown={hasBreakdown}/>
                )}
            </div>
        </div>
    );
}

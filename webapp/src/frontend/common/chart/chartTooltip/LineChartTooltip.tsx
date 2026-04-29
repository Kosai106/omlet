import classNames from "classnames";

import { type Tag as TagModel } from "../../../../common/models/Tag";
import { Tag } from "../../../library/Tag/Tag";
import { TruncateFromMiddle } from "../../truncate/TruncateFromMiddle";

import { ChartTooltipSide } from "./ChartTooltipSide";

import classes from "./LineChartTooltip.module.css";

export interface LineChartTooltipProps {
    side: ChartTooltipSide.Top | ChartTooltipSide.Bottom;
    color: string;
    title: string;
    tags: string[];
    tagMap: Record<string, TagModel>;
    subtitle?: string;
    content?: string;
    value: number;
    valueLabel: string;
    previousValue?: number;
}

const sideClasses = {
    [ChartTooltipSide.Top]: classes.top,
    [ChartTooltipSide.Bottom]: classes.bottom,
};

export function LineChartTooltip({
    side,
    color,
    title,
    tags,
    tagMap,
    subtitle,
    content,
    value,
    valueLabel,
    previousValue,
}: LineChartTooltipProps) {
    let valueChange;
    if (previousValue === value) {
        valueChange = (
            <div className={classes.lineChartTooltipValue}>
                <span className={classes.noChange}>No change</span> from previous scan
            </div>
        );
    } else if (previousValue) {
        const valueTrend = previousValue < value ? "up" : "down";
        const valueClass = previousValue < value ? classes.increase : classes.decrease;
        const changePercentage = Math.round(100 * Math.abs(value - previousValue) / previousValue);
        valueChange = (
            <div className={classes.lineChartTooltipValue}>
                <span className={valueClass}>{changePercentage}% {valueTrend}</span> from previous scan
            </div>
        );
    }
    const cls = classNames(classes.lineChartTooltip, sideClasses[side]);

    return (
        <div className={cls} style={{ borderLeftColor: color }}>
            <div className={classes.lineChartTooltipHeader}>
                <div className={classes.lineChartTooltipTitle}>{title}</div>
                {subtitle && <TruncateFromMiddle className={classes.lineChartTooltipSubtitle} text={subtitle} width={284} />}
                {tags.length ? <div className={classes.tags}>{tags.map(tag => <Tag key={tag} tag={tagMap[tag] ?? { name: tag }} />)}</div> : null}
                {content && <div className={classes.lineChartTooltipContent}>{content}</div>}
            </div>
            <div className={classes.lineChartTooltipValues}>
                <div className={classes.lineChartTooltipValue}>
                    <span className={classes.value}>{value}</span> {valueLabel}s
                </div>
                {valueChange}
            </div>
        </div>
    );
}

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import classNames from "classnames";

import { type Tag as TagModel } from "../../../../common/models/Tag";
import { pluralize } from "../../../../common/utils";
import { Tag } from "../../../library/Tag/Tag";
import { formatPercentage } from "../../../utils";

import { ChartTooltipSide } from "./ChartTooltipSide";

import classes from "./ChartTooltip.module.css";

interface BaseProps {
    x: number;
    y: number;
    side?: ChartTooltipSide;
    color: string;
    title: string;
    subtitle?: string;
    value: number;
    valueSum?: number;
}

export type ChartTooltipProps = BaseProps & ({
    tags: string[];
    tagMap: Record<string, TagModel>;
} | {
    tags?: never;
    tagMap?: never;
});

const sideClasses = {
    [ChartTooltipSide.Top]: classes.top,
    [ChartTooltipSide.Right]: classes.right,
    [ChartTooltipSide.Bottom]: classes.bottom,
    [ChartTooltipSide.Left]: classes.left,
};

export const TOOLTIP_OFFSET = 8;

export const ChartTooltip = forwardRef<HTMLDivElement, ChartTooltipProps>(({
    x,
    y,
    side = ChartTooltipSide.Top,
    color,
    title,
    subtitle,
    tags,
    tagMap,
    value,
    valueSum,
}, ref) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [currentSide, setCurrentSide] = useState<ChartTooltipSide>(side);

    useImperativeHandle(ref, () => tooltipRef.current!, []);

    useLayoutEffect(() => {
        if (!tooltipRef.current) {
            return;
        }

        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            setCurrentSide(ChartTooltipSide.Left);
        }
    }, [tooltipRef.current, x, y]);


    return (
        <div
            ref={tooltipRef}
            className={classNames(classes.chartTooltip, sideClasses[currentSide])}
            style={{ left: x, top: y, borderLeftColor: color }}>
            <div className={classes.chartTooltipHeader}>
                <div className={classes.chartTooltipTitle}>{title}</div>
                {subtitle && <div className={classes.chartTooltipSubtitle}>{subtitle}</div>}
                {tags && tags.length !== 0 && tagMap && <div className={classes.tags}>{tags.map(tag => <Tag key={tag} tag={tagMap[tag] ?? { name: tag }} />)}</div>}
            </div>
            <div className={classes.chartTooltipValues}>
                {
                    valueSum === undefined ? (
                        <div className={classes.chartTooltipSingleValue}>
                            Used
                            {" "}
                            <strong>
                                {pluralize("time", value)}
                            </strong>
                        </div>
                    ) : (
                        <>
                            <div className={classes.chartTooltipValueCell}>
                                <div className={classes.chartTooltipValue}>{formatPercentage(valueSum === 0 ? 0 : value / valueSum)}</div>
                                <div className={classes.chartTooltipTotal}>of total</div>
                            </div>
                            <div className={classes.chartTooltipValueCell}>
                                <div className={classes.chartTooltipValue}>{value}</div>
                                <div className={classes.chartTooltipTotal}>of {valueSum}</div>
                            </div>
                        </>
                    )
                }
            </div>
        </div>
    );
});

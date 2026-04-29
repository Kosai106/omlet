import { useMemo, useState } from "react";

import classNames from "classnames";

import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { type Tag } from "../../../../common/models/Tag";
import { range } from "../../../utils";
import { ChartType } from "../ChartType";
import { InfiniteScroll } from "../infiniteScroll/InfiniteScroll";
import { Legend } from "../legend/Legend";
import { type LegendItem } from "../legend/LegendItem";

import { Bar } from "./bar/Bar";
import { type ChartMode } from "./ChartMode";

import classes from "./BarChart.module.css";

interface ShowAllProps {
    value: number;
    onClick(): void;
}

function ShowAll({ value, onClick }: ShowAllProps) {
    return (
        <div className={classes.showAll}>
            <div className={classes.showAllLabel}>{value} more</div>
            <button className={classes.showAllButton} onClick={onClick}>Show All</button>
        </div>
    );
}

interface Props {
    className?: string;
    labelClassName?: string;
    type?: ChartType;
    mode: ChartMode;
    data: ChartDatum[];
    tagMap: Record<string, Tag>;
    legendItems: LegendItem[];
    hasBreakdown?: boolean;
    linksDisabled?: boolean;
    displayLegend?: boolean;
    displayGrid?: boolean;
    displayTooltip?: boolean;
}

const SHOW_MORE_THRESHOLD = 12;
const PAGE_SIZE = 50;
const LARGE_BAR_THRESHOLD = 8;

export function BarChart({
    className,
    labelClassName,
    type = ChartType.Default,
    mode,
    data,
    tagMap,
    legendItems,
    hasBreakdown = false,
    linksDisabled = false,
    displayLegend = false,
    displayGrid = false,
    displayTooltip = false,
}: Props) {
    const [shouldShowAll, setShouldShowAll] = useState(false);
    const [sliceSize, setSliceSize] = useState(Math.min(SHOW_MORE_THRESHOLD, data.length));

    const colorMap = useMemo(() => Object.fromEntries(legendItems.map(({ id, color }) => [id, color!])), [legendItems]);
    const maxValue = useMemo(() => Math.max(...data.map(({ values }) =>
        values.reduce((sum, { value }) => sum + value, 0))
    ), [data]);
    const maxLength = useMemo(() => Math.max(...data.map(({ values }) => values.length)), [data]);

    const cls = classNames(classes.barChart, className, {
        [classes.largeBar]: type !== ChartType.Small && data.length <= LARGE_BAR_THRESHOLD,
        [classes.hasLegend]: displayLegend,
        [classes.hasGrid]: displayGrid,
    });

    const dataSlice = data.slice(0, sliceSize);

    return (
        <div className={cls}>
            {displayLegend && <Legend className={classes.barChartLegend} items={legendItems}/>}
            <InfiniteScroll
                className={classes.content}
                hasNext={shouldShowAll && sliceSize < data.length}
                onEnd={() => setSliceSize(prev => prev + PAGE_SIZE)}>
                {dataSlice.map(({ id, label, values, link, infoTooltip }) => (
                    <Bar
                        labelClassName={labelClassName}
                        key={id}
                        link={link}
                        type={type}
                        mode={mode}
                        maxValue={maxValue}
                        maxLength={maxLength}
                        hasBreakdown={hasBreakdown}
                        label={label}
                        values={values}
                        colorMap={colorMap}
                        tagMap={tagMap}
                        linksDisabled={linksDisabled}
                        infoTooltip={infoTooltip}
                        displayTooltip={displayTooltip}/>
                ))}
                {!shouldShowAll && data.length > SHOW_MORE_THRESHOLD && (
                    <ShowAll value={data.length - SHOW_MORE_THRESHOLD} onClick={() => setShouldShowAll(true)}/>
                )}
            </InfiniteScroll>
            {displayGrid && (
                <>
                    <div className={classes.grid}>
                        {[...range(0, 10)].map(i =>
                            <div key={i} className={classes.gridLine}/>
                        )}
                    </div>
                    <div className={classes.bottomAxis}>
                        {[...range(0, 10)].map(i =>
                            <span key={i} className={classes.bottomAxisLabel}>{i * 10}%</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

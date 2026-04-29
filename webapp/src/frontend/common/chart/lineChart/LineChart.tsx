import { useMemo, useState } from "react";


import { type Margin } from "@nivo/core";
import { type CustomLayerProps, type Serie, type PointTooltipProps, ResponsiveLine } from "@nivo/line";
import classNames from "classnames";
import millify from "millify";

import { CHART_COLORS } from "../../../../common/colorUtils";
import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { type ChartValue } from "../../../../common/models/ChartValue";
import { dataFrequencyDayGaps } from "../../../../common/models/DataFrequencyOption";
import { type Tag } from "../../../../common/models/Tag";
import { type TimeSeriesFilter } from "../../../../common/models/TimeSeriesFilter";
import { timeWindowOptionIntoDate } from "../../../../common/models/TimeWindowOption";
import { compareString } from "../../../../common/sortUtils";
import { formatDate } from "../../../utils";
import { ChartTooltipSide } from "../chartTooltip/ChartTooltipSide";
import { type LineChartTooltipProps, LineChartTooltip } from "../chartTooltip/LineChartTooltip";
import { ChartType } from "../ChartType";
import { SortType, InteractiveLegend } from "../legend/InteractiveLegend";
import { type LegendItem } from "../legend/LegendItem";

import classes from "./LineChart.module.css";

function transformData(data: ChartDatum[]) {
    const dataWithValueMap = data.map(({ label, values }) => ({
        label,
        valueMap: Object.fromEntries(values.map(({ id, value }) => [id, value])),
    }));
    return data[0].values
        .map(({ id }) => ({
            id,
            data: dataWithValueMap.map(({ label, valueMap }) => ({
                x: label,
                y: valueMap[id],
            })),
        }));
}

type DataMap = Record<string, Pick<ChartValue, "name" | "extra" | "tags">>;

function getLegendItems(data: ReturnType<typeof transformData>, labelMap: DataMap, sortType: SortType): LegendItem[] {
    return data.sort((d1, d2) => {
        const lastIndex = d1.data.length - 1;

        if (sortType === SortType.Value) {
            for (let i = lastIndex; i > -1; i--) {
                const diff = d2.data[i].y - d1.data[i].y;

                if (diff !== 0) {
                    return diff;
                }
            }
        } else if (sortType === SortType.ValueIncrease) {
            for (let i = lastIndex; i > 0; i--) {
                const d2Diff = d2.data[i].y - d2.data[i - 1].y;
                const d1Diff = d1.data[i].y - d1.data[i - 1].y;
                const diff = d2Diff - d1Diff;

                if (diff !== 0) {
                    return diff;
                }
            }
        }

        return compareString(d1.id, d2.id);
    }).map(({ id }, index) => ({
        id,
        name: labelMap[id].name,
        color: index < CHART_COLORS.length ? CHART_COLORS[index] : undefined,
    }));
}

interface Props {
    className?: string;
    type?: ChartType;
    data: ChartDatum[];
    tagMap: Record<string, Tag>;
    margin?: Margin;
    timeSeriesFilter?: TimeSeriesFilter;
    axisBottomTickPadding?: number;
    axisBottomTickSize?: number;
    axisBottomItemCountHint?: number;
    displayLegend?: boolean;
}

const SMALL_CHART_DATA_THRESHOLD = 6;
const INITIAL_DATA_THRESHOLD = CHART_COLORS.length;

export function LineChart({
    className,
    type = ChartType.Default,
    data,
    tagMap,
    margin,
    timeSeriesFilter,
    axisBottomTickPadding = 8,
    axisBottomTickSize = 0,
    axisBottomItemCountHint = Number.POSITIVE_INFINITY,
    displayLegend = false,
}: Props) {
    const [searchValue, setSearchValue] = useState<string>("");
    const [sortType, setSortType] = useState<SortType>(SortType.Value);

    const dataMap: DataMap = useMemo(() => Object.fromEntries(data[data.length - 1].values.map(({ id, name, extra, tags }) => [id, { name, extra, tags }])), [data]);
    const transformedData = useMemo(() => transformData(data), [data]);
    const [legendItems, setLegendItems] = useState<LegendItem[]>(getLegendItems(transformedData, dataMap, sortType));
    const colorMap = Object.fromEntries(legendItems.map(({ id, color }) => [id, color]));

    const visibleItemCount = type === ChartType.Small ? SMALL_CHART_DATA_THRESHOLD : INITIAL_DATA_THRESHOLD;
    const selectedItemCount = type === ChartType.Small ? SMALL_CHART_DATA_THRESHOLD : INITIAL_DATA_THRESHOLD / 2;
    const tickValues = useMemo(() => {
        let startDate, endDate;

        startDate = new Date(data[0].id).getTime();
        endDate = new Date(data[data.length - 1].id).getTime();
        let dayGapBetweenFrequency = 1;

        if (timeSeriesFilter) {
            startDate = timeWindowOptionIntoDate(timeSeriesFilter.timeWindow)?.getTime() ?? startDate;
            endDate = new Date().getTime();
            dayGapBetweenFrequency = dataFrequencyDayGaps[timeSeriesFilter.frequency];
        }

        const numberOfDays = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000 * dayGapBetweenFrequency));

        return Math.max(1, Math.min(numberOfDays, axisBottomItemCountHint));
    }, [data, timeSeriesFilter]);

    const alwaysVisibleItems = new Set(legendItems.slice(0, visibleItemCount).map(({ id }) => id));
    const initialSelectedItems = new Set(legendItems.slice(0, selectedItemCount).map(({ id }) => id));
    const [selectedItems, setSelectedItems] = useState<Set<string>>(initialSelectedItems);
    const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

    function handleSearch(value: string) {
        setSearchValue(value);
    }

    function handleSortChange(value: SortType) {
        setSortType(value);

        const newLegendItems = getLegendItems(transformedData, dataMap, value);
        setLegendItems(newLegendItems);

        const newSelectedItems = new Set(newLegendItems.slice(0, selectedItemCount).map(({ id }) => id));
        setSelectedItems(newSelectedItems);
    }

    function handleItemMouseEnter(id: string) {
        setHoveredLineId(id);
    }

    function handleItemMouseLeave() {
        setHoveredLineId(null);
    }

    function handleItemChange(value: string, checked: boolean) {
        if (checked) {
            selectedItems.add(value);
        } else {
            selectedItems.delete(value);
        }

        setSelectedItems(new Set(selectedItems));
    }

    const valueLabel = "usage";
    const chartData = transformedData.filter(({ id }) => alwaysVisibleItems.has(id) || selectedItems.has(id));
    const maxValue = Math.max(...chartData.flatMap(({ data }) => data.map(({ y }) => y)));

    function HoverLayer({ series }: CustomLayerProps) {
        if (!hoveredLineId) {
            return null;
        }

        const serie = series.find(({ id }) => id === hoveredLineId);

        if (!serie) {
            return null;
        }

        const [start, ...rest] = serie.data.map(({ position }) => position);

        if (!start.y) {
            return null;
        }

        return (
            <path
                d={`M${start.x},${start.y}${rest.map(({ x, y }) => `L${x},${y}`).join("")}`}
                fill="none"
                stroke={serie.color}
                strokeWidth={7}
                opacity={0.5}/>
        );
    }

    // push null values to chartData as padding to before/after
    const paddedChartData = useMemo(() => chartData.map(({ id, data }) => {
        const startPadding = [];
        const endPadding = [];
        if (timeSeriesFilter) {
            const first = data[0];
            const firstDataDate = new Date(first.x);
            const startPivotDate = timeWindowOptionIntoDate(timeSeriesFilter.timeWindow);
            const dayGapBetweenFrequency = dataFrequencyDayGaps[timeSeriesFilter.frequency];
            while (startPivotDate && startPivotDate < firstDataDate) {
                startPadding.push({ x: startPivotDate.toISOString(), y: null });
                startPivotDate.setDate(startPivotDate.getDate() + dayGapBetweenFrequency);
            }
            const last = data[data.length - 1];
            const lastDataDate = new Date(last.x);
            const endPivotDate = new Date();
            while (endPivotDate > lastDataDate) {
                endPadding.push({ x: endPivotDate.toISOString(), y: null });
                endPivotDate.setDate(endPivotDate.getDate() - dayGapBetweenFrequency);
            }
        }

        return {
            id: id,
            data: [...startPadding, ...data, ...endPadding],
        };
    }), [data, timeSeriesFilter]);

    return (
        <div className={classNames(classes.lineChart, className, { [classes.small]: type === ChartType.Small })}>
            <div className={classes.chartContainer}>
                <ResponsiveLine
                    key={JSON.stringify(paddedChartData)}
                    data={paddedChartData}
                    curve="linear"
                    layers={["grid", "axes", HoverLayer, "lines", "points", "mesh"]}
                    pointSize={8}
                    axisLeft={{
                        tickPadding: 16,
                        tickSize: 0,
                        format(value: number) {
                            if (Math.floor(value) !== value) {
                                return "";
                            }

                            return (
                                <>
                                    <tspan>{millify(value, { precision: 1 })}</tspan>
                                    <title>{value}</title>
                                </>
                            );
                        },
                    }}
                    axisBottom={{
                        tickPadding: axisBottomTickPadding,
                        tickSize: axisBottomTickSize,
                        tickValues,
                        format(value: Date) {
                            return (
                                <>
                                    <tspan>{formatDate(value, { day: "numeric", month: "short" })}</tspan>
                                    <title>{formatDate(value)}</title>
                                </>
                            );
                        },
                    }}
                    xScale={{
                        type: "time",
                        format: "%Y-%m-%dT%H:%M:%S.%L%Z",
                        precision: "minute",
                        useUTC: false,
                    }}
                    yScale={{
                        type: "linear",
                        nice: true,
                    }}
                    margin={margin}
                    colors={(datum: Serie) => {
                        if (selectedItems.has(datum.id.toString())) {
                            return colorMap[datum.id] ?? "var(--label-secondary-color)";
                        }

                        return "rgba(var(--button-background-disabled-color-rgb), 0.5)";
                    }}
                    lineWidth={3}
                    theme={{
                        fontFamily: "Inter, system-ui, Roboto, sans-serif",
                        textColor: "var(--label-secondary-color)",
                        fontSize: 13,
                        axis: {
                            ticks: {
                                line: {
                                    stroke: "var(--border-secondary-color)",
                                    opacity: 0.2,
                                },
                            },
                        },
                        grid: {
                            line: {
                                stroke: "var(--border-secondary-color)",
                                opacity: 0.2,
                            },
                        },
                    }}
                    tooltip={({ point }: PointTooltipProps) => {
                        const lineDatum = chartData.find(({ id }) => id === point.serieId)!;
                        const [, datumIndex] = point.id.match(/.*\.(\d+)/) ?? [];
                        const pointIndex = datumIndex ? Number.parseInt(datumIndex, 10) : -1;

                        let previousValue;
                        if (pointIndex > 0) {
                            previousValue = lineDatum.data[pointIndex - 1].y;
                        }

                        let content: LineChartTooltipProps["content"];
                        const currentYear = new Date().getFullYear();
                        try {
                            const labelDate = new Date(point.data.x);
                            content = labelDate.getFullYear() === currentYear
                                ? formatDate(labelDate, { day: "numeric", month: "short", hour: "numeric", minute: "numeric" })
                                : formatDate(labelDate, { dateStyle: "medium", timeStyle: "short" });
                        } catch {
                            content = undefined;
                        }

                        const { name, extra, tags = [] } = dataMap[point.serieId.toString()];
                        const value = Number(point.data.y);
                        const side = value > maxValue / 2 ? ChartTooltipSide.Bottom : ChartTooltipSide.Top;

                        return (
                            <>
                                <div className={classes.point} style={{ backgroundColor: point.serieColor }}/>
                                <LineChartTooltip
                                    side={side}
                                    color={point.serieColor}
                                    title={name}
                                    subtitle={extra}
                                    content={content}
                                    value={value}
                                    valueLabel={valueLabel}
                                    tags={tags}
                                    tagMap={tagMap}
                                    previousValue={previousValue}/>
                            </>
                        );
                    }}
                    enableGridX
                    enableGridY
                    isInteractive
                    useMesh
                    enablePoints={data.length === 1}
                    enableCrosshair={false}
                    animate={false}
                    onMouseMove={point => {
                        setHoveredLineId(point.serieId.toString());
                    }}
                    onMouseLeave={() => {
                        setHoveredLineId(null);
                    }}/>
            </div>
            {displayLegend && (
                <InteractiveLegend
                    items={legendItems}
                    valueLabel={valueLabel}
                    searchValue={searchValue}
                    sortType={sortType}
                    selectedItems={selectedItems}
                    onSearch={handleSearch}
                    onSortChange={handleSortChange}
                    onItemMouseEnter={handleItemMouseEnter}
                    onItemMouseLeave={handleItemMouseLeave}
                    onItemChange={handleItemChange}/>
            )}
        </div>
    );
}

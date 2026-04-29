import { useMemo, useRef } from "react";


import { type Margin } from "@nivo/core";
import {
    type Serie,
    type PointTooltipProps,
    type CustomLayerProps,
    ResponsiveLine,
} from "@nivo/line";
import classNames from "classnames";

import { TAG_TO_CHART_COLOR_MAP } from "../../../../common/colorUtils";
import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { type Tag } from "../../../../common/models/Tag";
import { type TimeSeriesFilter, getDataFrequencyDayGapForGraph } from "../../../../common/models/TimeSeriesFilter";
import { timeWindowOptionIntoDate } from "../../../../common/models/TimeWindowOption";
import { formatDate } from "../../../utils";
import { ChartTooltip, type ChartTooltipProps } from "../chartTooltip/ChartTooltip";
import { ChartTooltipSide } from "../chartTooltip/ChartTooltipSide";
import { ChartType } from "../ChartType";
import { Legend } from "../legend/Legend";
import { type LegendItem } from "../legend/LegendItem";

import classes from "./LineAreaChart.module.css";

function transformData(dataWithValueMap: DataWithValueMap): TransformedData {
    return Object.entries(dataWithValueMap.reduce((acc, { label, valueMap, sum }) => {
        let currentPercentage = 0;
        Object.entries(valueMap).forEach(([tag, value]) => {
            currentPercentage += sum === 0 ? 0 : value / sum;
            acc[tag] ??= [];
            const xDate = new Date(label);
            xDate.setUTCHours(0, 0, 0, 0);
            acc[tag].push({ x: xDate.toISOString(), y: currentPercentage });
        });
        return acc;
    }, {} as Record<string, DataPoint[]>)).map(([key, value]) => ({ id: key, data: value }));
}

type DataWithValueMap = {
    label: string;
    valueMap: {
        [k: string]: number;
    };
    sum: number;
}[];

type DataPoint = {
    x: string; y: number;
};

type TransformedData = {
    id: string;
    data: DataPoint[];
}[];

interface Props {
    className?: string;
    type?: ChartType;
    data: ChartDatum[];
    margin?: Margin;
    legendItems: LegendItem[];
    tagMap: Record<string, Tag>;
    timeSeriesFilter?: TimeSeriesFilter;
    axisBottomTickPadding?: number;
    axisBottomTickSize?: number;
    axisBottomItemCountHint?: number;
    displayLegend?: boolean;
}

export function LineAreaChart({
    className,
    type = ChartType.Default,
    data,
    margin,
    timeSeriesFilter,
    legendItems,
    tagMap,
    axisBottomTickPadding = 16,
    axisBottomTickSize = 0,
    displayLegend = false,
}: Props) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const dataWithValueMap = useMemo(() => data.map(({ label, values }) => ({
        label,
        valueMap: Object.fromEntries(values.map(({ id, value }) => [id, value])),
        sum: values.reduce((current, { value }) => current + value, 0),
    })), [data]);
    const chartData = useMemo(() => transformData(dataWithValueMap), [data]);
    const colorMap = Object.fromEntries(legendItems.map(({ id, color }) => [id, TAG_TO_CHART_COLOR_MAP[color!]]));
    function SingleBar({ series, innerHeight }: CustomLayerProps) {
        if (data.length > 1) {
            return null;
        }

        return series
            .map(serie => {
                const filledData = serie.data.find(data => data.position.y !== null);
                if (!filledData) {
                    return null;
                }
                return {
                    color: serie.color,
                    x: filledData.position.x,
                    y: filledData.position.y,
                };
            })
            .filter(a => a !== null)
            .sort((a, b) => a!.y - b!.y)
            .map((data) => {
                const { color, x, y } = data!;

                return (
                    <path
                        key={color}
                        d={`M${x - 4},${y} L${x + 4},${y} L${x + 4},${innerHeight} L${x - 4},${innerHeight} Z`}
                        shapeRendering="crispEdges"
                        fill={color as string}/>
                );
            });
    }

    const gridXValues = useMemo(() => {
        const xValues = [];
        if (timeSeriesFilter) {
            const startPivotDate = timeWindowOptionIntoDate(timeSeriesFilter.timeWindow);
            if (startPivotDate) {
                startPivotDate.setUTCHours(0, 0, 0, 0);
                const dayGapBetweenFrequency = getDataFrequencyDayGapForGraph(timeSeriesFilter);
                const endDate = new Date();
                endDate.setUTCHours(0, 0, 0, 0);
                while (startPivotDate <= endDate) {
                    xValues.push(new Date(startPivotDate));
                    startPivotDate.setDate(startPivotDate.getDate() + dayGapBetweenFrequency);
                }
            }
        }
        return xValues;
    }, [timeSeriesFilter]);

    const paddedChartData = useMemo(() => chartData.map(({ id, data }) => {
        const emptyValues = gridXValues.map(xValue => ({ x: xValue.toISOString(), y: null }));

        return {
            id: id,
            data: [...data, ...emptyValues],
        };
    }), [data, timeSeriesFilter]);

    return (
        <div className={classNames(classes.lineAreaChart, className, { [classes.small]: type === ChartType.Small })}>
            <div className={classes.chartContainer} ref={chartContainerRef}>
                {displayLegend && <Legend className={classes.lineAreaChartLegend} items={legendItems}/>}
                <ResponsiveLine
                    key={JSON.stringify(paddedChartData)}
                    data={paddedChartData}
                    curve="linear"
                    layers={["axes", "points", "areas", SingleBar, "grid", "mesh"]}
                    enableArea
                    areaOpacity={1}
                    axisLeft={{
                        tickPadding: 16,
                        tickSize: 0,
                        format(value: number) {
                            return `${Math.round(value * 100)}%`;
                        },
                    }}
                    axisBottom={{
                        tickPadding: axisBottomTickPadding,
                        tickSize: axisBottomTickSize,
                        tickValues: gridXValues.slice(1),
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
                        precision: "hour",
                        useUTC: false,
                    }}
                    yScale={{
                        type: "linear",
                        nice: true,
                    }}
                    margin={margin}
                    colors={(datum: Serie) => {
                        return colorMap[datum.id] ?? "rgba(var(--button-background-disabled-color-rgb), 0.5)";
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

                        const currentYear = new Date().getFullYear();

                        const data = dataWithValueMap[pointIndex];
                        const sum = data.sum;
                        const value = data.valueMap[point.serieId];
                        const tag = tagMap[lineDatum.id];

                        let subtitle: ChartTooltipProps["subtitle"];
                        try {
                            const labelDate = new Date(data.label);
                            subtitle = labelDate.getFullYear() === currentYear
                                ? formatDate(labelDate, { day: "numeric", month: "short", hour: "numeric", minute: "numeric" })
                                : formatDate(labelDate, { dateStyle: "medium", timeStyle: "short" });
                        } catch {
                            subtitle = undefined;
                        }

                        return (
                            <>
                                <div className={classes.point} style={{ backgroundColor: point.serieColor }}/>
                                <ChartTooltip
                                    side={point.data.y === 1 ? ChartTooltipSide.Bottom : ChartTooltipSide.Top}
                                    x={0}
                                    y={0}
                                    color={point.color}
                                    title={tag?.name ?? lineDatum.id}
                                    subtitle={subtitle}
                                    value={value}
                                    valueSum={sum}/>
                            </>
                        );
                    }}
                    enableGridX
                    gridXValues={gridXValues}
                    enableGridY
                    isInteractive
                    useMesh
                    enablePoints={false}
                    enableCrosshair={false}
                    animate={false}/>
            </div>
        </div>
    );
}

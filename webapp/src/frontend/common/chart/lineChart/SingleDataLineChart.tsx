import { useMemo, useState } from "react";

import { type Margin } from "@nivo/core";
import { type PointSymbolProps, type Serie, type PointTooltipProps, type CustomLayerProps, ResponsiveLine } from "@nivo/line";
import classNames from "classnames";
import millify from "millify";

import { CHART_COLORS } from "../../../../common/colorUtils";
import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { type ChartValue } from "../../../../common/models/ChartValue";
import { type Tag } from "../../../../common/models/Tag";
import { compareString } from "../../../../common/sortUtils";
import { formatDate, isToday } from "../../../utils";
import { ChartTooltipSide } from "../chartTooltip/ChartTooltipSide";
import { type LineChartTooltipProps, LineChartTooltip } from "../chartTooltip/LineChartTooltip";
import { ChartType } from "../ChartType";
import { InteractiveLegend } from "../legend/InteractiveLegend";
import { type LegendItem } from "../legend/LegendItem";

import classes from "./SingleDataLineChart.module.css";

const DOT_SIZE = 8;
const DIGIT_SIZE = 9;
const TICK_PADDING = 16;
const SMALL_CHART_DATA_THRESHOLD = 6;
const INITIAL_DATA_THRESHOLD = CHART_COLORS.length;

function transformData(data: ChartDatum) {
    const transformedData = data.values
        .map(({ id }) => ({
            id,
            data: [{
                x: data.label,
                y: data.values.find(({ id: valueId }) => valueId === id)!.value,
            }],
        }));

    transformedData.sort((d1, d2) => {
        const diff = d2.data[0].y - d1.data[0].y;

        if (diff !== 0) {
            return diff;
        }

        return compareString(d1.id, d2.id);
    });

    return transformedData.map(({ id, data }) => {
        const [{ x, y }] = data;
        const dataDate = new Date(x);

        const previousData = [];
        let date = new Date(dataDate);

        date.setDate(dataDate.getDate() - 7 * 3);
        previousData.push({ x: date.toISOString(), y: Math.round(y * 0.7) });

        date = new Date(dataDate);
        date.setDate(dataDate.getDate() - 7 * 2);
        previousData.push({ x: date.toISOString(), y: Math.round(y * 1) });

        date = new Date(dataDate);
        date.setDate(dataDate.getDate() - 7);
        previousData.push({ x: date.toISOString(), y: Math.round(y * 1.05) });

        const nextData = [];

        date = new Date(dataDate);
        date.setDate(dataDate.getDate() + 7);
        nextData.push({ x: date.toISOString(), y: Math.round(y * 1.1) });

        date = new Date(dataDate);
        date.setDate(dataDate.getDate() + 7 * 2);
        nextData.push({ x: date.toISOString(), y: Math.round(y * 1.15) });

        date = new Date(dataDate);
        date.setDate(dataDate.getDate() + 7 * 3);
        nextData.push({ x: date.toISOString(), y: Math.round(y * 1.25) });

        return {
            id,
            data: [...previousData, ...data, ...nextData],
        };
    });
}

type DataMap = Record<string, Pick<ChartValue, "name" | "extra" | "tags">>;

function getLegendItems(data: ReturnType<typeof transformData>, labelMap: DataMap): LegendItem[] {
    return data.map(({ id }, index) => ({
        id,
        name: labelMap[id].name,
        color: index < CHART_COLORS.length ? CHART_COLORS[index] : undefined,
    }));
}

function DashedLine({ series }: CustomLayerProps) {
    return series.map(({ id, data }) => {
        const [start, ...rest] = data.map(({ position }) => position);

        return (
            <path
                key={id}
                d={`M${start.x},${start.y}${rest.map(({ x, y }) => `L${x},${y}`).join("")}`}
                fill="none"
                stroke="var(--button-background-disabled-color)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 6"/>
        );
    }
    );
}

interface Props {
    className?: string;
    margin?: Margin;
    type?: ChartType;
    displayLegend?: boolean;
    data: ChartDatum;
    tagMap: Record<string, Tag>;
}

export function SingleDataLineChart({
    className,
    type,
    margin,
    displayLegend,
    data,
    tagMap,
}: Props) {
    const [searchValue, setSearchValue] = useState("");

    const dataMap: DataMap = useMemo(() => Object.fromEntries(data.values.map(({ id, name, extra, tags }) => [id, { name, extra, tags }])), [data]);
    const transformedData = useMemo(() => transformData(data), [data]);
    const legendItems = useMemo(() => getLegendItems(transformedData, dataMap), [transformedData, dataMap]);

    const colorMap = useMemo(() => Object.fromEntries(legendItems.map(({ id, color }) => [id, color])), [legendItems]);

    const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

    const selectedItemCount = type === ChartType.Small ? SMALL_CHART_DATA_THRESHOLD : INITIAL_DATA_THRESHOLD / 2;
    const initialSelectedItems = new Set(legendItems.slice(0, selectedItemCount).map(({ id }) => id));
    const [selectedItems, setSelectedItems] = useState<Set<string>>(initialSelectedItems);

    const valueLabel = "usage";
    const chartData = transformedData.filter(({ id }) => selectedItems.has(id));
    const maxValue = Math.max(...chartData.flatMap(({ data }) => data.map(({ y }) => y)));

    function handleSearch(value: string) {
        setSearchValue(value);
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

    const marginLeft = Math.max(margin?.left ?? 0, String(maxValue).split("").length * DIGIT_SIZE + TICK_PADDING);

    function HoverLayer({ series }: CustomLayerProps) {
        if (!hoveredLineId) {
            return null;
        }

        const serie = series.find(({ id }) => id === hoveredLineId);

        if (!serie) {
            return null;
        }

        const [start, ...rest] = serie.data.map(({ position }) => position);

        return (
            <path
                d={`M${start.x},${start.y}${rest.map(({ x, y }) => `L${x},${y}`).join("")}`}
                fill="none"
                stroke={serie.color}
                strokeWidth={7}
                opacity={0.5}/>
        );
    }

    return (
        <div className={classNames(classes.singleDataLineChart, { [classes.small]: type === ChartType.Small }, className)}>
            <div className={classes.chartContainer}>
                <ResponsiveLine
                    key={JSON.stringify(chartData)}
                    data={chartData}
                    curve="linear"
                    layers={["grid", "axes", HoverLayer, DashedLine, "points", "mesh"]}
                    axisLeft={{
                        tickPadding: TICK_PADDING,
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
                        tickPadding: TICK_PADDING,
                        tickSize: 0,
                        format(value: Date) {
                            const axisLabel = isToday(value) ? "Today" : formatDate(value, { day: "numeric", month: "short" });

                            return (
                                <>
                                    <tspan>{axisLabel}</tspan>
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
                    margin={{ ...margin, left: marginLeft }}
                    colors={(datum: Serie) => {
                        return colorMap[datum.id] ?? "var(--label-secondary-color)";
                    }}
                    theme={{
                        fontFamily: "Inter, system-ui, Roboto, sans-serif",
                        textColor: "var(--label-secondary-color)",
                        fontSize: 13,
                        axis: {
                            ticks: {
                                line: {
                                    stroke: "var(--background-secondary-color)",
                                },
                            },
                        },
                        grid: {
                            line: {
                                stroke: "var(--background-secondary-color)",
                            },
                        },
                    }}
                    pointSymbol={({ datum, color }: PointSymbolProps) => {
                        const x = datum.x as Date;
                        const dataDate = new Date(data.id);

                        if (x.toDateString() !== dataDate.toDateString()) {
                            return null;
                        }

                        return (
                            <g pointerEvents="none">
                                <rect
                                    x={-DOT_SIZE / 2}
                                    y={-DOT_SIZE / 2}
                                    width={DOT_SIZE}
                                    height={DOT_SIZE}
                                    rx={DOT_SIZE}
                                    fill={color}/>
                            </g>
                        );
                    }}
                    tooltip={({ point }: PointTooltipProps) => {
                        const pointDate = point.data.x as Date;
                        const dataDate = new Date(data.id);

                        if (pointDate.toDateString() !== dataDate.toDateString()) {
                            return null;
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
                            <LineChartTooltip
                                tags={tags}
                                tagMap={tagMap}
                                side={side}
                                color={point.serieColor}
                                title={name}
                                subtitle={extra}
                                content={content}
                                value={value}
                                valueLabel={valueLabel}/>
                        );
                    }}
                    enableGridX
                    enableGridY
                    isInteractive
                    useMesh
                    enablePoints
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
                    className={classes.legend}
                    items={legendItems}
                    valueLabel={valueLabel}
                    searchValue={searchValue}
                    selectedItems={selectedItems}
                    onSearch={handleSearch}
                    onItemChange={handleItemChange}
                    onItemMouseEnter={handleItemMouseEnter}
                    onItemMouseLeave={handleItemMouseLeave}/>
            )}
        </div>
    );
}

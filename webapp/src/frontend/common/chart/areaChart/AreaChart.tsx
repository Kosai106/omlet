import { type ReactNode, useState, useMemo } from "react";

import { type Margin } from "@nivo/core";
import { type StreamCustomLayerProps, type StreamLayer, ResponsiveStream } from "@nivo/stream";
import classNames from "classnames";

import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { formatDate, hexToRGBA, isLight } from "../../../utils";
import { type AreaChartTooltipProps, AreaChartTooltip } from "../chartTooltip/AreaChartTooltip";
import { ChartTooltipSide } from "../chartTooltip/ChartTooltipSide";
import { Legend } from "../legend/Legend";
import { type LegendItem } from "../legend/LegendItem";

import classes from "./AreaChart.module.css";

interface Props {
    className?: string;
    data: ChartDatum[];
    margin?: Margin;
    axisBottomTickPadding?: number;
    axisBottomTickSize?: number;
    gridLineColor?: string;
    drawGridOnTop?: boolean;
    formatAxisLeft?(value: number): ReactNode;
    legendItems: LegendItem[];
    displayLegend?: boolean;
}

function defaultFormatAxisLeft(value: number): string {
    return `${Math.round(value * 100)}%`;
}

const DOT_SIZE = 5;
const DOT_HOVERED_SIZE = 8;

export function AreaChart({
    className,
    data,
    margin,
    axisBottomTickPadding = 8,
    axisBottomTickSize = 8,
    gridLineColor = "var(--background-secondary-color)",
    drawGridOnTop = false,
    formatAxisLeft = defaultFormatAxisLeft,
    legendItems,
    displayLegend = false,
}: Props) {
    const [tooltipProps, setTooltipProps] = useState<AreaChartTooltipProps | null>(null);

    const chartData = useMemo(() => data.map(({ values }) => Object.fromEntries(values.map(({ id, value }) => [id, value]))), [data]);
    const labelMap = useMemo(() => Object.fromEntries(data[0].values.map(({ id, name }) => [id, name])), [data]);
    const breakdownNames = useMemo(() => legendItems.map(({ id }) => id), [legendItems]);
    const colorMap = useMemo(() => Object.fromEntries(legendItems.map(({ id, color }) => [id, color!])), [legendItems]);

    const currentYear = new Date().getFullYear();
    const bottomAxisLabels = data.map(({ label }) => label);

    const rootStyle = window.getComputedStyle(document.body);

    function handleMouseLeave() {
        setTooltipProps(null);
    }

    // since area layers are transparent, rendering a chart on backgrounds with colors other than white causes the chart to be displayed in unintended colors
    // here we render a base white background behind the main chart area (i.e. except axes), so that areas look the same regardless of background
    function BackgroundLayer(props: StreamCustomLayerProps) {
        let width = 0;
        let height = 0;
        for (const layer of props.layers) {
            const maxX = Math.max(...layer.data.map(datum => datum.x));
            if (maxX > width) {
                width = maxX;
            }

            const maxY = Math.max(...layer.data.map(datum => datum.y1));
            if (maxY > height) {
                height = maxY;
            }
        }

        return <rect width={width} height={height} fill="var(--background-primary-color)"/>;
    }

    function TooltipLayer(props: StreamCustomLayerProps) {
        return (
            <g className={classes.tooltipLayer}>
                <defs>
                    <linearGradient
                        id="tooltipLayerLightPattern"
                        spreadMethod="repeat"
                        gradientUnits="userSpaceOnUse"
                        x1="0" y1="0" x2="0" y2="4"
                        gradientTransform="rotate(-20)">
                        <stop stopColor="rgba(var(--label-selected-color-rgb), 0.5)" offset="0%"/>
                        <stop stopColor="rgba(var(--label-selected-color-rgb), 0.5)" offset="50%"/>
                        <stop stopColor="transparent" offset="50%"/>
                        <stop stopColor="transparent" offset="100%"/>
                    </linearGradient>
                    <linearGradient
                        id="tooltipLayerDarkPattern"
                        spreadMethod="repeat"
                        gradientUnits="userSpaceOnUse"
                        x1="0" y1="0" x2="0" y2="4"
                        gradientTransform="rotate(-20)">
                        <stop stopColor="rgba(var(--label-primary-color-rgb), 0.4)" offset="0%"/>
                        <stop stopColor="rgba(var(--label-primary-color-rgb), 0.4)" offset="50%"/>
                        <stop stopColor="transparent" offset="50%"/>
                        <stop stopColor="transparent" offset="100%"/>
                    </linearGradient>
                </defs>
                {props.slices.flatMap(({ stack }) => {
                    const valueSum = stack.reduce((sum, { value }) => sum + value, 0);
                    const sortedStack = [...stack].sort(({ y1: y11, y2: y12 }, { y1: y21, y2: y22 }) =>
                        Math.min(y21, y22) - Math.min(y11, y12)
                    );

                    return sortedStack.map(({ index, x, y1, y2, color, layerLabel, value }, stackIndex) => {
                        let hasLightColor;
                        try {
                            const [, colorVar] = color.match(/^var\(([\w-]+)\)$/)!;
                            const colorValue = rootStyle.getPropertyValue(colorVar);

                            hasLightColor = isLight(hexToRGBA(colorValue));
                        } catch {
                            hasLightColor = false;
                        }

                        const y = Math.min(y1, y2);
                        const height = Math.abs(y2 - y1);

                        return (
                            <g
                                key={`tooltipRectGroup-${layerLabel}-${value}-${x}-${y1}-${y2}`}
                                className={classes.tooltipRectGroup}
                                opacity={0}
                                onMouseEnter={() => {
                                    const side = stackIndex === sortedStack.length - 1 ? ChartTooltipSide.Bottom : ChartTooltipSide.Top;
                                    const tooltipY = side === ChartTooltipSide.Top ? y : y + height;

                                    let subtitle: AreaChartTooltipProps["subtitle"];
                                    try {
                                        const labelDate = new Date(data[index].label);
                                        subtitle = labelDate.getFullYear() === currentYear
                                            ? formatDate(labelDate, { day: "numeric", month: "short", hour: "numeric", minute: "numeric" })
                                            : formatDate(labelDate, { dateStyle: "medium", timeStyle: "short" });
                                    } catch {
                                        subtitle = undefined;
                                    }

                                    setTooltipProps({
                                        x,
                                        y: tooltipY,
                                        side,
                                        color,
                                        title: layerLabel.toString(),
                                        subtitle,
                                        value,
                                        valueSum,
                                    });
                                }}
                                onMouseLeave={handleMouseLeave}>
                                <rect
                                    x={x - 8}
                                    y={y}
                                    width={16}
                                    height={height}
                                    fill="transparent"/>
                                <rect
                                    x={x - 4}
                                    y={y}
                                    width={8}
                                    height={height}
                                    fill={hasLightColor ? "url(#tooltipLayerDarkPattern)" : "url(#tooltipLayerLightPattern)"}/>
                                {stackIndex !== sortedStack.length - 1 && (
                                    <>
                                        <rect
                                            x={x - DOT_HOVERED_SIZE / 2 - 1}
                                            y={y - DOT_HOVERED_SIZE / 2 - 1}
                                            width={DOT_HOVERED_SIZE + 2}
                                            height={DOT_HOVERED_SIZE + 2}
                                            fill="rgba(0, 0, 0, 0.2)"
                                            rx={1.5}
                                            ry={1.5}
                                            pointerEvents="none"/>
                                        <rect
                                            x={x - DOT_HOVERED_SIZE / 2}
                                            y={y - DOT_HOVERED_SIZE / 2}
                                            width={DOT_HOVERED_SIZE}
                                            height={DOT_HOVERED_SIZE}
                                            fill="var(--background-primary-color)"
                                            rx={1}
                                            ry={1}
                                            pointerEvents="none"/>
                                    </>
                                )}
                                {stackIndex !== 0 && (
                                    <>
                                        <rect
                                            x={x - DOT_HOVERED_SIZE / 2 - 1}
                                            y={y - DOT_HOVERED_SIZE / 2 + height - 1}
                                            width={DOT_HOVERED_SIZE + 2}
                                            height={DOT_HOVERED_SIZE + 2}
                                            fill="rgba(0, 0, 0, 0.2)"
                                            rx={1.5}
                                            ry={1.5}
                                            pointerEvents="none"/>
                                        <rect
                                            x={x - DOT_HOVERED_SIZE / 2}
                                            y={y - DOT_HOVERED_SIZE / 2 + height}
                                            width={DOT_HOVERED_SIZE}
                                            height={DOT_HOVERED_SIZE}
                                            fill="var(--background-primary-color)"
                                            rx={1}
                                            ry={1}
                                            pointerEvents="none"/>
                                    </>
                                )}
                            </g>
                        );
                    });
                })}
                {tooltipProps && <AreaChartTooltip {...tooltipProps}/>}
            </g>
        );
    }

    const period = Math.ceil(chartData.length / 7);
    const middle = Math.floor(period / 2);
    const layers: StreamLayer[] = drawGridOnTop
        ? [BackgroundLayer, "axes", "layers", "grid", "dots", TooltipLayer]
        : [BackgroundLayer, "axes", "grid", "layers", "dots", TooltipLayer];

    return (
        <div
            className={classNames(classes.areaChart, className)}
            onMouseLeave={handleMouseLeave}>
            {displayLegend && <Legend className={classes.areaChartLegend} items={legendItems}/>}
            <ResponsiveStream
                key={JSON.stringify(data)}
                data={chartData}
                keys={breakdownNames}
                label={datum => labelMap[datum.id]}
                colors={datum => colorMap[datum.id]}
                curve="linear"
                offsetType="expand"
                axisLeft={{
                    tickPadding: 16,
                    tickSize: 0,
                    format: formatAxisLeft,
                }}
                axisBottom={{
                    tickPadding: axisBottomTickPadding,
                    tickSize: axisBottomTickSize,
                    format(value: string) {
                        const v = Number.parseInt(value, 10);
                        // This is a temporary fix to prevent overlapping labels
                        // @nivo/stream doesn't support x axis with time scale. It considers all values as points.
                        // However, we can configure x axis as time scale if we use @nivo/line
                        if (v % period !== middle) {
                            return "";
                        }
                        const label = bottomAxisLabels[v];
                        return (
                            <>
                                <tspan>{formatDate(label, { day: "numeric", month: "short" })}</tspan>
                                <title>{formatDate(label)}</title>
                            </>
                        );
                    },
                }}
                dotComponent={({ datum: { layerLabel, index }, x, y }) => {
                    const firstValues = data[0].values;
                    if (firstValues.length < 2) {
                        return null;
                    }

                    const lastValueName = firstValues[firstValues.length - 1].name;
                    if (layerLabel === lastValueName) {
                        return null;
                    }

                    return (
                        <g
                            key={`dotGroup-${layerLabel}-${index}-${x}-${y}`}
                            pointerEvents="none">
                            <rect
                                x={x - DOT_SIZE / 2 - 1}
                                y={y - DOT_SIZE / 2 - 1}
                                width={DOT_SIZE + 2}
                                height={DOT_SIZE + 2}
                                fill="rgba(0, 0, 0, 0.2)"
                                rx={1.5}
                                ry={1.5}/>
                            <rect
                                x={x - DOT_SIZE / 2}
                                y={y - DOT_SIZE / 2}
                                width={DOT_SIZE}
                                height={DOT_SIZE}
                                fill="var(--background-primary-color)"
                                rx={1}
                                ry={1}/>
                        </g>
                    );
                }}
                dotPosition="end"
                margin={margin}
                fillOpacity={0.7}
                theme={{
                    fontFamily: "Inter, system-ui, Roboto, sans-serif",
                    textColor: "var(--label-secondary-color)",
                    fontSize: 13,
                    axis: {
                        ticks: {
                            line: {
                                stroke: gridLineColor,
                            },
                        },
                    },
                    grid: {
                        line: {
                            stroke: gridLineColor,
                        },
                    },
                }}
                tooltip={() => null}
                enableStackTooltip={false}
                layers={layers}
                enableGridX
                enableGridY
                enableDots
                animate={false}/>
        </div>
    );
}

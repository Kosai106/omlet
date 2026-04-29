import { useState, useMemo } from "react";

import { type Margin } from "@nivo/core";
import { type StreamCustomLayerProps, ResponsiveStream, type StreamLayerDatum } from "@nivo/stream";
import classNames from "classnames";

import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { type Tag, getCoreTag, getNonCoreTag, createTag, RESERVED_TAGS } from "../../../../common/models/Tag";
import { Browser } from "../../../enums";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { formatDate, getBrowser, hexToRGBA, isLight, isToday } from "../../../utils";
import { type AreaChartTooltipProps, AreaChartTooltip } from "../chartTooltip/AreaChartTooltip";
import { ChartTooltipSide } from "../chartTooltip/ChartTooltipSide";
import { Legend } from "../legend/Legend";
import { type LegendItem } from "../legend/LegendItem";

import classes from "./SingleDataAreaChart.module.css";

interface Props {
    className?: string;
    margin?: Margin;
    displayLegend?: boolean;
    data: ChartDatum;
}

const CORE_COLOR = "var(--label-secondary-color)";
const OTHER_COLOR = "var(--button-background-disabled-color)";

function generateMockData(data: ChartDatum, coreTag: Tag, otherTag: Tag): ChartDatum[] {
    const dataDate = new Date(data.label);
    const today = new Date();

    const coreChartValue = data.values.find(({ id }) => id === coreTag.slug) ?? {
        id: coreTag.slug,
        name: coreTag.name,
        value: 0,
    };

    const nonCoreChartValue = data.values.find(({ id }) => id === otherTag.slug) ?? {
        id: otherTag.slug,
        name: otherTag.name,
        value: 0,
    };

    let coreValue = coreChartValue.value;
    let nonCoreValue = nonCoreChartValue.value;
    if (coreValue === 0 && nonCoreValue === 0) {
        coreValue = 500;
        nonCoreValue = 500;
    } else if (coreValue === 0) {
        coreValue = Math.round(nonCoreValue / 2);
    } else if (nonCoreValue === 0) {
        nonCoreValue = Math.round(coreValue / 2);
    }

    // current scan
    const currentScan = { ...data, values: [coreChartValue, nonCoreChartValue] };

    // previous scans
    const previousScans: ChartDatum[] = [];
    let date = new Date(dataDate);

    date.setDate(dataDate.getDate() - 7 * 4);
    previousScans.push({
        id: date.toISOString(),
        label: date.toISOString(),
        values: [{
            ...coreChartValue,
            value: Math.round(coreValue * 0.4),
        }, {
            ...nonCoreChartValue,
            value: Math.round(nonCoreValue * 1.6),
        }],
    });

    date = new Date(dataDate);
    date.setDate(dataDate.getDate() - 7 * 3);
    previousScans.push({
        id: date.toISOString(),
        label: date.toISOString(),
        values: [{
            ...coreChartValue,
            value: Math.round(coreValue * 0.6),
        }, {
            ...nonCoreChartValue,
            value: Math.round(nonCoreValue * 1.4),
        }],
    });

    date = new Date(dataDate);
    date.setDate(dataDate.getDate() - 7 * 2);
    previousScans.push({
        id: date.toISOString(),
        label: date.toISOString(),
        values: [{
            ...coreChartValue,
            value: Math.round(coreValue * 0.6),
        }, {
            ...nonCoreChartValue,
            value: Math.round(nonCoreValue * 1.4),
        }],
    });

    date = new Date(dataDate);
    date.setDate(dataDate.getDate() - 7);
    previousScans.push({
        id: date.toISOString(),
        label: date.toISOString(),
        values: [{
            ...coreChartValue,
            value: Math.round(coreValue * 0.8),
        }, {
            ...nonCoreChartValue,
            value: Math.round(nonCoreValue * 1.2),
        }],
    });

    // next scans
    const nextScans: ChartDatum[] = [];
    date = new Date(today);
    date.setDate(today.getDate() + 7);
    nextScans.push({
        id: date.toISOString(),
        label: date.toISOString(),
        values: [{
            ...coreChartValue,
            value: Math.round(coreValue * 1.1),
        }, {
            ...nonCoreChartValue,
            value: Math.round(nonCoreValue * 0.9),
        }],
    });

    date = new Date(today);
    date.setDate(today.getDate() + 7 * 2);
    nextScans.push({
        id: date.toISOString(),
        label: date.toISOString(),
        values: [{
            ...coreChartValue,
            value: Math.round(coreValue * 1.5),
        }, {
            ...nonCoreChartValue,
            value: Math.round(nonCoreValue * 0.5),
        }],
    });

    return [
        ...previousScans,
        currentScan,
        ...nextScans,
    ];
}

const DOT_SIZE = 8;
const REAL_DATA_INDEX = 4;

const dummyTag = createTag({
    slug: "other-tag",
    name: "Other tag",
});

export function SingleDataAreaChart({
    className,
    margin,
    displayLegend,
    data,
}: Props) {
    const [tooltipProps, setTooltipProps] = useState<AreaChartTooltipProps | null>(null);

    const { selectors: { getTags } } = useStore();
    const tags = getTags();
    const coreTag = useMemo(() => getCoreTag(tags), [tags]);
    const nonCoreTag = getNonCoreTag(coreTag);
    const allTags = [...tags, nonCoreTag, RESERVED_TAGS.UNTAGGED];

    const otherTagSlug = data.values.find(({ id }) => id !== coreTag.slug)?.id;
    const otherTag = allTags.find(tag => tag.slug === otherTagSlug) ?? dummyTag;
    const legendItems: LegendItem[] = [
        { id: coreTag.slug, name: coreTag.name, color: CORE_COLOR },
        { id: otherTag.slug, name: otherTag.name, color: OTHER_COLOR },
    ];

    const breakdownNames = [coreTag.slug, otherTag.slug];
    const colorMap = {
        [coreTag.slug]: CORE_COLOR,
        [otherTag.slug]: OTHER_COLOR,
    };

    const mockData = useMemo(() => generateMockData(data, coreTag, otherTag), [data, coreTag, otherTag]);
    const chartData = useMemo(() => mockData.map(({ values }) => Object.fromEntries(values.map(({ id, value }) => [id, value]))), [mockData]);
    const labelMap = useMemo(() => Object.fromEntries(mockData[0].values.map(({ id, name }) => [id, name])), [mockData]);
    const bottomAxisLabels = mockData.map(({ label }) => label);

    const rootStyle = window.getComputedStyle(document.body);

    function handleMouseLeave() {
        setTooltipProps(null);
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
                {props.slices.flatMap(({ stack, index }) => {
                    if (index !== REAL_DATA_INDEX) {
                        return null;
                    }

                    const valueSum = stack.reduce((sum, { value }) => sum + value, 0);
                    const sortedStack: StreamLayerDatum[] = [...stack].sort(({ y1: y11, y2: y12 }, { y1: y21, y2: y22 }) =>
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
                                opacity={layerLabel === otherTag.name ? 0 : 1}
                                onMouseEnter={() => {
                                    const side = stackIndex === sortedStack.length - 1 ? ChartTooltipSide.Bottom : ChartTooltipSide.Top;
                                    const tooltipY = side === ChartTooltipSide.Top ? y : y + height;

                                    let subtitle: AreaChartTooltipProps["subtitle"];
                                    try {
                                        const labelDate = new Date(mockData[index].label);
                                        subtitle = labelDate.getFullYear() === new Date().getFullYear()
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
                            </g>
                        );
                    });
                })}
                {tooltipProps && <AreaChartTooltip {...tooltipProps}/>}
            </g>
        );
    }

    return (
        <div
            className={classNames(classes.singleDataAreaChart, className)}
            onMouseLeave={handleMouseLeave}>
            {displayLegend && <Legend className={classes.legend} items={legendItems}/>}
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
                    format(value: number) {
                        // in Safari SVG text line heights are rounded, resulting in shift for labels
                        const dy = getBrowser() === Browser.Safari ? 4.5 : undefined;

                        return <tspan dy={dy}>{`${Math.round(value * 100)}%`}</tspan>;
                    },
                }}
                axisBottom={{
                    // in Safari bottom axis is shorter and appears closer to chart
                    tickPadding: getBrowser() === Browser.Safari ? 28 : 16,
                    tickSize: 0,
                    format(value: string) {
                        const index = Number.parseInt(value, 10);
                        const label = bottomAxisLabels[index];
                        const fill = label === data.label ? "var(--accent-green)" : undefined;
                        const axisLabel = isToday(label) ? "Today" : formatDate(label, { day: "numeric", month: "short" });

                        return (
                            <>
                                <tspan fill={fill}>{axisLabel}</tspan>
                                <title>{formatDate(label)}</title>
                            </>
                        );
                    },
                }}
                dotComponent={({ datum: { layerLabel, index }, x, y }) => {
                    if (index !== REAL_DATA_INDEX || layerLabel === otherTag.name) {
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
                            <rect
                                x={x - DOT_SIZE / 2 + 1}
                                y={y - DOT_SIZE / 2 + 1}
                                width={DOT_SIZE - 2}
                                height={DOT_SIZE - 2}
                                fill="var(--chart-color-1)"/>
                        </g>
                    );
                }}
                dotPosition="end"
                margin={margin}
                theme={{
                    fontFamily: "Inter, system-ui, Roboto, sans-serif",
                    textColor: "var(--label-secondary-color)",
                    fontSize: 13,
                    axis: {
                        ticks: {
                            line: {
                                stroke: "rgba(var(--background-tertiary-color-rgb), 0.2)",
                            },
                        },
                    },
                    grid: {
                        line: {
                            stroke: "rgba(var(--background-tertiary-color-rgb), 0.2)",
                        },
                    },
                }}
                tooltip={() => null}
                enableStackTooltip={false}
                layers={["axes", "layers", "grid", TooltipLayer, "dots"]}
                enableGridX
                enableGridY
                enableDots
                animate={false}/>
        </div>
    );
}

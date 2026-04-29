import { useEffect, useMemo, useRef, useState } from "react";

import { useQueries } from "@tanstack/react-query";
import LZString from "lz-string";
import { useParams } from "react-router-dom";

import { AnalysisType } from "../../../../common/models/AnalysisType";
import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { type Filter } from "../../../../common/models/Filter";
import { getCoreTag, getNonCoreTag, RESERVED_TAGS, type Tag } from "../../../../common/models/Tag";
import { DEFAULT_TIME_SERIES_FILTER, getNextAvailableFilter } from "../../../../common/models/TimeSeriesFilter";
import { getDataAnalysis } from "../../../api/api";
import { SingleDataAreaChart } from "../../../common/chart/areaChart/SingleDataAreaChart";
import { LineAreaChart } from "../../../common/chart/lineAreaChart/LineAreaChart";
import { LineChart } from "../../../common/chart/lineChart/LineChart";
import { SingleDataLineChart } from "../../../common/chart/lineChart/SingleDataLineChart";
import { getLegendItems } from "../../../common/chart/utils";
import { Loading } from "../../../library/Loading/Loading";
import { Tooltip } from "../../../library/Tooltip/Tooltip";
import { AccessLevel } from "../../../models/AccessLevel";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { getMainChart, PredefinedChartType } from "../constants";
import { DashboardSectionHeader } from "../dashboardSectionHeader/DashboardSectionHeader";
import { DropdownTags } from "../dropdownTags/DropdownTags";
import { FirstScanTooltip } from "../firstScanTooltip/FirstScanTooltip";
import { ChartInsight } from "../insight/ChartInsight";
import { SetupSteps } from "../setupSteps/SetupSteps";

import classes from "./MainChart.module.css";

function EmptyState() {
    return (
        <p className={classes.emptyState}>
            No results with this selection.
        </p>
    );
}

interface StrongTextWithTooltipProps {
    text: string;
    tooltip: string;
}

function StrongTextWithTooltip({
    text,
    tooltip,
}: StrongTextWithTooltipProps) {
    const ref = useRef<HTMLElement>(null);

    return (
        <Tooltip content={tooltip}>
            <strong
                className={classes.strongTextWithTooltip}
                ref={ref}>
                {text}
            </strong>
        </Tooltip>
    );
}

export function MainChart() {
    const { workspaceSlug } = useParams();
    const {
        selectors: {
            getTags,
            getWorkspace,
            getAccessLevel,
        },
    } = useStore();
    const tags = getTags();
    const workspace = getWorkspace()!;
    const accessLevel = getAccessLevel();
    const projects = workspace?.projects ?? [];
    const numOfAnalyses = workspace?.numOfAnalyses ?? 0;
    const projectMap = Object.fromEntries(projects.map(p => [p.packageName, p]));
    const coreTag = useMemo(() => getCoreTag(tags), [tags]);
    const nonCoreTag = getNonCoreTag(coreTag);
    const allTags = [...tags, nonCoreTag, RESERVED_TAGS.UNTAGGED];
    const [comparedTag, setComparedTag] = useState<Tag>(nonCoreTag);
    const reservedTagSlugs = Object.values(RESERVED_TAGS).map(({ slug }) => slug);
    const userDefinedTags = useMemo(() => tags.filter(({ slug }) => !reservedTagSlugs.includes(slug)), [tags]);
    const hasUserDefinedTags = userDefinedTags.length > 0;

    const tagMap = useMemo(() => Object.fromEntries(allTags.map(t => [t.slug, t])), [tags]);

    const { analysisType, analysisSubject, filters, nonCoreFilters, title } = getMainChart(coreTag, comparedTag, hasUserDefinedTags);
    const [timeSeriesFilter, setTimeSeriesFilter] = useState(DEFAULT_TIME_SERIES_FILTER);

    const { chartData, isLoading } = useQueries({
        queries: [filters, nonCoreFilters]
            .filter((filters): filters is Filter[] => filters !== undefined)
            .map(filters => ({
                queryKey: [
                    "analysis",
                    workspace,
                    analysisType,
                    analysisSubject,
                    filters,
                    timeSeriesFilter,
                ],
                queryFn() {
                    return getDataAnalysis({
                        workspace,
                        analysisType,
                        analysisSubject,
                        filters,
                        timeSeriesFilter,
                    });
                },
                enabled: workspaceSlug !== undefined,
            })),
        combine([
            { data: coreChartData, isLoading: isCoreLoading },
            { data: otherData, isLoading: isOtherLoading } = { data: undefined, isLoading: false },
        ]) {
            let chartData;

            const otherChartData: ChartDatum[] | undefined = otherData?.map(chartDatum => ({
                ...chartDatum,
                values: [{
                    id: comparedTag.slug,
                    name: comparedTag.name,
                    color: comparedTag.color,
                    value: chartDatum.values.reduce((sum, chartValue) => sum + chartValue.value, 0),
                }],
            }));

            if (coreChartData === undefined && otherChartData === undefined) {
                chartData = undefined;
            } else if (otherChartData === undefined) {
                chartData = coreChartData;
            } else if (coreChartData === undefined) {
                chartData = otherChartData;
            } else {
                chartData = coreChartData.map(chartDatum => ({
                    ...chartDatum,
                    values: [
                        ...chartDatum.values,
                        ...otherChartData.find(otherChartDatum => otherChartDatum.id === chartDatum.id)?.values ?? [],
                    ],
                }));
            }

            return {
                chartData,
                isLoading: isCoreLoading || isOtherLoading,
            };
        },
    });

    useEffect(() => {
        if (chartData !== undefined && chartData.length === 0) {
            setTimeSeriesFilter(getNextAvailableFilter(timeSeriesFilter));
        }
    }, [chartData]);

    function renderComponentAdoptionOverTimeDescription() {
        return (
            <>
                Change in
                {" "}
                <StrongTextWithTooltip text={coreTag.name} tooltip={RESERVED_TAGS.CORE.tooltip}/>
                {" "}
                vs.
                {" "}
                <DropdownTags
                    workspaceSlug={workspaceSlug!}
                    tags={tags}
                    value={comparedTag}
                    linksDisabled={accessLevel === AccessLevel.Page}
                    onChange={setComparedTag}/>
                {" "}
                component usage over time
            </>
        );
    }

    function renderMainChartDescription() {
        if (userDefinedTags.length === 0) {
            return (
                <>
                    Change in total
                    {" "}
                    <StrongTextWithTooltip text={coreTag.name} tooltip={RESERVED_TAGS.CORE.tooltip}/>
                    {" "}
                    component usage over time
                </>
            );
        }

        return renderComponentAdoptionOverTimeDescription();
    }

    function renderChart() {
        if (chartData === undefined) {
            return null;
        }

        if (chartData.length === 0) {
            return <EmptyState/>;
        }

        if (numOfAnalyses > 1) {
            const legendItems = getLegendItems(chartData, projectMap, tagMap, analysisType, analysisSubject);

            if (userDefinedTags.length === 0) {
                return (
                    <LineChart
                        className={classes.componentAdoptionOverTimeChart}
                        margin={{ top: 5, right: 40, bottom: 48, left: 49 }}
                        data={chartData}
                        timeSeriesFilter={timeSeriesFilter}
                        axisBottomItemCountHint={10}
                        tagMap={tagMap}/>
                );
            }

            return (
                <LineAreaChart
                    tagMap={tagMap}
                    className={classes.componentAdoptionOverTimeChart}
                    data={chartData}
                    margin={{ top: 5, right: 40, bottom: 48, left: 49 }}
                    axisBottomTickPadding={16}
                    axisBottomTickSize={0}
                    timeSeriesFilter={timeSeriesFilter}
                    legendItems={legendItems}/>
            );
        }

        if (userDefinedTags.length === 0) {
            return (
                <>
                    <SingleDataLineChart
                        className={classes.componentAdoptionOverTimeChart}
                        margin={{ top: 5, right: 21, bottom: 48, left: 49 }}
                        data={chartData[0]}
                        tagMap={tagMap}/>
                    <FirstScanTooltip/>
                </>
            );
        }

        return (
            <>
                <SingleDataAreaChart
                    className={classes.componentAdoptionOverTimeChart}
                    margin={{ top: 5, right: 21, bottom: 48, left: 49 }}
                    data={chartData[0]}/>
                <FirstScanTooltip/>
            </>
        );
    }

    const searchParams = new URLSearchParams({
        type: analysisType,
        subject: analysisSubject,
        timeSeriesFilter: LZString.compressToEncodedURIComponent(JSON.stringify(timeSeriesFilter)),
    });

    if (!nonCoreFilters?.length) {
        searchParams.set("filters", LZString.compressToEncodedURIComponent(JSON.stringify(filters)));
    }

    const link = accessLevel === AccessLevel.Page ? undefined : `view?${searchParams.toString()}`;

    if (isLoading) {
        return <Loading className={classes.loading}/>;
    }

    return (
        <section className={classes.mainContent}>
            <DashboardSectionHeader
                className={classes.mainHeader}
                link={link}
                title={title}
                description={renderMainChartDescription()}/>
            <div className={classes.chartContent}>
                {renderChart()}
                <SetupSteps
                    isRegularScansSetup={numOfAnalyses > 2}
                    hasNonReservedTags={hasUserDefinedTags}/>
            </div>
            {chartData && chartData.length > 1 && (
                <ChartInsight
                    numOfAnalyses={numOfAnalyses}
                    chartType={PredefinedChartType.ComponentAdoptionOverTime}
                    data={chartData}
                    analysisType={AnalysisType.DataOverTime}
                    comparedTag={comparedTag}/>
            )}
        </section>
    );
}

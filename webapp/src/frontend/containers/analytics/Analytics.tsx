import { type ReactNode, useMemo, useState, useRef } from "react";

import { useQuery, skipToken } from "@tanstack/react-query";
import classNames from "classnames";

import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { AnalysisType } from "../../../common/models/AnalysisType";
import { BreakdownType } from "../../../common/models/BreakdownType";
import { type Filter } from "../../../common/models/Filter";
import { RESERVED_TAGS } from "../../../common/models/Tag";
import { type TimeSeriesFilter } from "../../../common/models/TimeSeriesFilter";
import { compareString } from "../../../common/sortUtils";
import { getCustomProperties, getDataAnalysis, getDataAnalysisAsCSV } from "../../api/api";
import { getDataAnalysisKey } from "../../api/urlBuilder";
import { SingleDataAreaChart } from "../../common/chart/areaChart/SingleDataAreaChart";
import { BarChart } from "../../common/chart/barChart/BarChart";
import { ChartMode } from "../../common/chart/barChart/ChartMode";
import { LineAreaChart } from "../../common/chart/lineAreaChart/LineAreaChart";
import { LineChart } from "../../common/chart/lineChart/LineChart";
import { SingleDataLineChart } from "../../common/chart/lineChart/SingleDataLineChart";
import { getLegendItems } from "../../common/chart/utils";
import { Button, ButtonKind } from "../../library/Button/Button";
import { IconLink } from "../../library/icons/IconLink";
import { Loading } from "../../library/Loading/Loading";
import { AccessLevel } from "../../models/AccessLevel";
import { type PredefinedChartType } from "../../pages/popularCharts/constants";
import { ChartInsight } from "../../pages/popularCharts/insight/ChartInsight";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { triggerDownload } from "../../utils";
import { PageType, SharePopover } from "../SharePopover/SharePopover";

import { EmptyState } from "./emptyState/EmptyState";
import { Filters } from "./filters/Filters";
import { TimeSeriesFilters } from "./timeSeriesFilters/TimeSeriesFilters";

import classes from "./Analytics.module.css";

interface Props {
    numOfAnalyses: number;
    analysisType: AnalysisType;
    analysisSubject?: AnalysisSubject;
    customProperty?: string;
    filters: Filter[];
    breakdownType?: BreakdownType;
    timeSeriesFilter?: TimeSeriesFilter;
    titleText: string;
    title: ReactNode;
    description: ReactNode;
    chartActions: ReactNode;
    equivalentPredefinedChartType?: PredefinedChartType;
    onAnalysisTypeChange(analysisType: AnalysisType): void;
    onAnalysisSubjectChange(analysisSubject: AnalysisSubject, customProperty?: string): void;
    onFiltersChange(filters: Filter[]): void;
    onBreakdownTypeChange(breakdownType: BreakdownType | undefined): void;
    onTimeSeriesFilterChange(timeSeriesFilter: TimeSeriesFilter): void;
}

export function Analytics({
    numOfAnalyses,
    analysisType,
    analysisSubject,
    customProperty,
    filters,
    breakdownType,
    titleText,
    title,
    description,
    chartActions,
    equivalentPredefinedChartType,
    timeSeriesFilter,
    onAnalysisTypeChange,
    onAnalysisSubjectChange,
    onFiltersChange,
    onBreakdownTypeChange,
    onTimeSeriesFilterChange,
}: Props) {
    const shareButtonRef = useRef<HTMLButtonElement>(null);
    const [sharePopoverOpen, setSharePopoverOpen] = useState(false);

    const {
        selectors: {
            getTags,
            getDashboardURL,
            getAccessLevel,
            getWorkspace,
        },
    } = useStore();

    const tags = getTags();
    const allTags = [...tags, RESERVED_TAGS.UNTAGGED];
    const tagMap = useMemo(() => Object.fromEntries(allTags.map(t => [t.slug, t])), [tags]);
    const workspace = getWorkspace()!;
    const projects = workspace.projects ?? [];
    const projectMap = Object.fromEntries(projects.map(p => [p.packageName, p]));
    const accessLevel = getAccessLevel();

    async function handleDownloadCSV() {
        if (analysisSubject === undefined) {
            return;
        }

        const csvContent = await getDataAnalysisAsCSV({
            workspace,
            analysisType,
            analysisSubject,
            customProperty,
            filters,
            timeSeriesFilter,
            breakdownType,
        });

        const date = new Date().toISOString().split("T")[0];
        const fileName = analysisType === AnalysisType.DataOverTime
            ? `omlet_analysis_over_time_${date}.csv`
            : `omlet_analysis_latest_data_${date}.csv`;

        triggerDownload({
            data: URL.createObjectURL(new Blob([csvContent], { type: "text/csv" })),
            name: fileName,
        });
    }

    const { data: customProperties } = useQuery({
        queryKey: ["customProperties", workspace],
        async queryFn() {
            const customProperties = await getCustomProperties(workspace.slug);

            return Object.fromEntries(
                Object.entries(customProperties).sort(([k1], [k2]) => compareString(k1, k2))
            );
        },
    });

    const { data: chartData, isLoading } = useQuery({
        queryKey: [
            "analysis",
            workspace,
            analysisType,
            analysisSubject,
            customProperty,
            filters,
            timeSeriesFilter,
            breakdownType,
        ],
        queryFn: analysisSubject === undefined
            ? skipToken
            : () => getDataAnalysis({
                workspace,
                analysisType,
                analysisSubject,
                customProperty,
                filters,
                timeSeriesFilter,
                breakdownType,
            }),
        enabled: analysisSubject !== undefined,
    });

    function renderChartActions() {
        if (accessLevel === AccessLevel.Page) {
            return null;
        }

        return (
            <>
                <button className={classes.chartAction} onClick={handleDownloadCSV} disabled={analysisSubject === undefined}>Download CSV</button>
                <Button
                    ref={shareButtonRef}
                    kind={ButtonKind.Secondary}
                    icon={<IconLink/>}
                    disabled={analysisSubject === undefined}
                    onClick={() => setSharePopoverOpen(true)}>
                    Share chart
                </Button>
                {chartActions}
            </>
        );
    }

    function renderChartInsight() {
        if (!equivalentPredefinedChartType) {
            return null;
        }

        return (
            <ChartInsight
                className={classes.chartInsight}
                data={chartData}
                numOfAnalyses={numOfAnalyses}
                chartType={equivalentPredefinedChartType}
                analysisType={analysisType}/>
        );
    }

    function renderChartFilter() {
        if (analysisType === AnalysisType.LatestData) {
            return null;
        }
        return (
            <TimeSeriesFilters
                className={classNames(classes.timeSeriesFilter, {
                    [classes.areaChart]: analysisSubject === AnalysisSubject.Tags &&
                        (chartData?.[0]?.values.length !== 1),
                    [classes.empty]: !chartData || chartData.length === 0,
                    [classes.loading]: isLoading,
                })}
                timeSeriesFilter={timeSeriesFilter}
                onTimeSeriesFilterChange={onTimeSeriesFilterChange}/>
        );
    }

    function renderChart() {
        if (analysisSubject === undefined) {
            return (
                <EmptyState
                    analysisSubject={analysisSubject}
                    filters={filters}
                    onRemoveAllFilters={() => onFiltersChange([])}/>
            );
        }

        if (isLoading) {
            return <Loading className={classNames(classes.analyticsLoading, { [classes.lineChart]: analysisSubject !== AnalysisSubject.Tags })}/>;
        }

        if (chartData === undefined) {
            return null;
        }

        if (chartData.length === 0) {
            return (
                <EmptyState
                    analysisSubject={analysisSubject}
                    filters={filters}
                    onRemoveAllFilters={() => onFiltersChange([])}/>
            );
        }

        const dataAnalysisKey = getDataAnalysisKey({ workspace, analysisType, analysisSubject, customProperty, filters, timeSeriesFilter, breakdownType });
        const legendItems = getLegendItems(chartData, projectMap, tagMap, analysisType, analysisSubject, breakdownType);

        if (analysisType === AnalysisType.DataOverTime) {
            if (analysisSubject === AnalysisSubject.Tags && legendItems.length > 1) {
                if (numOfAnalyses === 1 && chartData.length === 1) {
                    const onlyData = chartData[0];

                    if (onlyData.values.length === 1) {
                        return (
                            <SingleDataLineChart
                                key={dataAnalysisKey}
                                data={onlyData}
                                tagMap={tagMap}
                                margin={{ top: 5, right: 48, bottom: 48, left: 100 }}
                                displayLegend/>
                        );
                    } else if (onlyData.values.length === 2) {
                        return (
                            <SingleDataAreaChart
                                key={dataAnalysisKey}
                                margin={{ top: 5, right: 48, bottom: 48, left: 112 }}
                                data={onlyData}
                                displayLegend/>
                        );
                    }
                }

                return (
                    <LineAreaChart
                        key={dataAnalysisKey}
                        data={chartData}
                        legendItems={legendItems}
                        tagMap={tagMap}
                        margin={{ top: 5, right: 48, bottom: 48, left: 100 }}
                        timeSeriesFilter={timeSeriesFilter}
                        displayLegend/>
                );
            }

            if (numOfAnalyses === 1 && chartData.length === 1) {
                return (
                    <SingleDataLineChart
                        key={dataAnalysisKey}
                        margin={{ top: 5, right: 48, bottom: 48, left: 100 }}
                        className={classes.dashboardLineChart}
                        tagMap={tagMap}
                        data={chartData[0]}
                        displayLegend/>
                );
            }


            return (
                <LineChart
                    key={dataAnalysisKey}
                    data={chartData}
                    tagMap={tagMap}
                    axisBottomItemCountHint={10}
                    margin={{ top: 5, right: 48, bottom: 48, left: 100 }}
                    timeSeriesFilter={timeSeriesFilter}
                    displayLegend/>
            );
        }

        let chartMode;
        if (!breakdownType) {
            chartMode = ChartMode.Absolute;
        } else if (analysisSubject === AnalysisSubject.Components && breakdownType === BreakdownType.ProjectUsedIn) {
            chartMode = ChartMode.Unique;
        } else {
            chartMode = ChartMode.Percentage;
        }

        return (
            <BarChart
                key={dataAnalysisKey}
                mode={chartMode}
                data={chartData}
                tagMap={tagMap}
                legendItems={legendItems}
                hasBreakdown={breakdownType !== undefined}
                displayLegend={breakdownType !== undefined || analysisSubject === AnalysisSubject.Components}
                displayGrid={chartMode === ChartMode.Percentage}
                linksDisabled={accessLevel === AccessLevel.Page}
                displayTooltip/>
        );
    }

    return (
        <main className={classes.analytics}>
            <Filters
                backURL={getDashboardURL()}
                analysisType={analysisType}
                analysisSubject={analysisSubject}
                customProperty={customProperty}
                filters={filters}
                breakdownType={breakdownType}
                customProperties={customProperties}
                disabled={accessLevel === AccessLevel.Page}
                onAnalysisTypeChange={onAnalysisTypeChange}
                onAnalysisSubjectChange={onAnalysisSubjectChange}
                onFiltersChange={onFiltersChange}
                onBreakdownTypeChange={onBreakdownTypeChange}/>
            <div className={classes.result}>
                <div className={classes.chart}>
                    <div className={classes.chartHeader}>
                        <div className={classes.chartInfoAndActions}>
                            <div className={classes.chartInfo}>
                                <div className={classes.chartTitle}>{title}</div>
                                <div className={classes.chartDescription}>{description}</div>
                            </div>
                            <div className={classes.chartActions}>
                                {renderChartActions()}
                            </div>
                        </div>
                        {renderChartInsight()}
                    </div>
                    <div className={classes.chartContent}>
                        {renderChartFilter()}
                        {renderChart()}
                    </div>
                </div>
            </div>
            {sharePopoverOpen && (
                <SharePopover
                    anchor={shareButtonRef.current!}
                    name={titleText}
                    pageType={PageType.Analysis}
                    onClose={() => setSharePopoverOpen(false)}/>
            )}
        </main>
    );
}

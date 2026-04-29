import { type ReactNode, useState, useEffect, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";
import LZString from "lz-string";
import { generatePath, Link } from "react-router-dom";

import { AnalysisType } from "../../../../common/models/AnalysisType";
import { BreakdownType } from "../../../../common/models/BreakdownType";
import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { hasSameFilters } from "../../../../common/models/Filter";
import { type Project } from "../../../../common/models/Project";
import { type Tag, getCoreTag, getNonCoreTag } from "../../../../common/models/Tag";
import { DEFAULT_TIME_SERIES_FILTER, getNextAvailableFilter } from "../../../../common/models/TimeSeriesFilter";
import { RoutePath } from "../../../../common/RoutePath";
import { compareChartDatumTagPercentage } from "../../../../common/sortUtils";
import { createSavedChart, getDataAnalysis } from "../../../api/api";
import { DashboardChart } from "../../../common/DashboardChart/DashboardChart";
import { SaveChartPopover } from "../../../common/SaveChartPopover/SaveChartPopover";
import { ContextMenu } from "../../../library/ContextMenu/ContextMenu";
import { useToast } from "../../../library/Toast/Toast";
import { logError } from "../../../logger";
import { useDataCacheStore } from "../../../providers/DataCacheProvider/DataCacheProvider";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { alertError } from "../../../utils";
import { type PredefinedChart, type PredefinedChartType } from "../constants";
import { ChartInsight } from "../insight/ChartInsight";

interface Props extends Omit<PredefinedChart, "description"> {
    workspaceSlug: string;
    numOfAnalyses: number;
    tags: Tag[];
    projectMap: Record<string, Project>;
    description: ReactNode;
    linksDisabled: boolean;
    readOnly: boolean;
    onLoad(chartType: PredefinedChartType): void;
}

export function PopularDashboardChart({
    workspaceSlug,
    numOfAnalyses,
    tags,
    projectMap,
    chartType,
    analysisType,
    analysisSubject,
    filters: initialFilters,
    nonCoreFilters,
    breakdownType,
    title,
    description: initialDescription,
    emptyStateMessage,
    fallbacks = [],
    linksDisabled,
    readOnly,
    onLoad,
}: Props) {
    const toast = useToast();

    const [saveChartPopoverOpen, setSaveChartPopoverOpen] = useState(false);
    const [timeSeriesFilter, setTimeSeriesFilter] = useState(analysisType === AnalysisType.DataOverTime ? DEFAULT_TIME_SERIES_FILTER : undefined);

    const coreTag = useMemo(() => getCoreTag(tags), [tags]);
    const nonCoreTag = getNonCoreTag(coreTag);

    const { actions: { addSavedChartData } } = useDataCacheStore();
    const {
        selectors: { getWorkspace },
    } = useStore();

    const workspace = getWorkspace()!;
    const tagMap = useMemo(() => Object.fromEntries(tags.map(t => [t.slug, t])), [tags]);

    function getLink() {
        const searchParams = new URLSearchParams();

        if (analysisType !== AnalysisType.LatestData) {
            searchParams.set("type", analysisType);
        }

        if (analysisSubject) {
            searchParams.set("subject", analysisSubject);
        }

        if (!nonCoreFilters?.length && filters?.length) {
            searchParams.set("filters", LZString.compressToEncodedURIComponent(JSON.stringify(filters)));
        }

        if (timeSeriesFilter) {
            searchParams.set("timeSeriesFilter", LZString.compressToEncodedURIComponent(JSON.stringify(timeSeriesFilter)));
        }

        if (breakdownType) {
            searchParams.set("breakdown", breakdownType);
        }

        const pathname = generatePath(RoutePath.NewAnalytics, { workspaceSlug });
        return `${pathname}?${searchParams.toString()}`;
    }

    async function handleSave(name: string, description: string) {
        try {
            setSaveChartPopoverOpen(false);

            const savedChart = await createSavedChart(workspaceSlug, {
                name,
                description,
                analysisType,
                analysisSubject,
                filters: filters ?? [],
                breakdownType,
                timeSeriesFilter,
            });

            addSavedChartData(savedChart);

            toast.show(
                <>
                    <span>Chart saved to dashboard&nbsp;•&nbsp;</span>
                    <Link
                        to={generatePath(RoutePath.SavedCharts, { workspaceSlug })}
                        onClick={() => toast.hide()}>
                        Go to Saved Dashboard
                    </Link>
                </>,
                10000
            );
        } catch (error) {
            logError(error);
            alertError(error as Error);
        }
    }

    const {
        data: {
            filters,
            chartData,
        } = {
            filters: initialFilters,
        },
        isFetched,
    } = useQuery({
        queryKey: [
            "analysis",
            workspace,
            analysisType,
            analysisSubject,
            initialFilters,
            nonCoreFilters,
            fallbacks,
            timeSeriesFilter,
            breakdownType,
        ],
        async queryFn({ signal }) {
            const allFilters = [initialFilters, ...fallbacks.map(({ filters }) => filters)];

            let filters = allFilters[0];
            let chartData: ChartDatum[] = [];

            for (filters of allFilters) {
                chartData = await getDataAnalysis({
                    workspace,
                    analysisType,
                    analysisSubject,
                    filters,
                    timeSeriesFilter,
                    breakdownType,
                }, signal);

                if (chartData.length > 0) {
                    break;
                }
            }

            if (nonCoreFilters !== undefined) {
                let nonCoreChartData = await getDataAnalysis({
                    workspace,
                    analysisType,
                    analysisSubject,
                    filters: nonCoreFilters,
                    timeSeriesFilter,
                }, signal);

                nonCoreChartData = nonCoreChartData.map(chartDatum => ({
                    ...chartDatum,
                    values: [{
                        id: nonCoreTag.slug,
                        name: nonCoreTag.name,
                        color: nonCoreTag.color,
                        value: chartDatum.values.reduce((sum, chartValue) => sum + chartValue.value, 0),
                    }],
                }));

                chartData = chartData.map(chartDatum => ({
                    ...chartDatum,
                    values: [
                        ...chartDatum.values,
                        ...nonCoreChartData.find(nonCoreChartDatum => nonCoreChartDatum.id === chartDatum.id)?.values ?? [],
                    ],
                }));

                if (breakdownType === BreakdownType.Tag) {
                    chartData.sort(compareChartDatumTagPercentage);
                }
            }

            return {
                chartData,
                filters,
            };
        },
    });

    const description = useMemo(() => {
        for (const fallback of fallbacks) {
            if (hasSameFilters(fallback.filters, filters)) {
                return fallback.description;
            }
        }

        return initialDescription;
    }, [fallbacks, filters]);

    useEffect(() => {
        if (timeSeriesFilter && chartData !== undefined && chartData.length === 0) {
            setTimeSeriesFilter(getNextAvailableFilter(timeSeriesFilter));
        }
    }, [chartData]);

    useEffect(() => {
        if (isFetched) {
            onLoad(chartType);
        }
    }, [isFetched]);

    function renderContextMenuItems() {
        if (linksDisabled || readOnly || nonCoreFilters !== undefined) {
            return null;
        }

        return (
            <ContextMenu.Button
                onClick={() => setSaveChartPopoverOpen(true)}>
                Save to dashboard
            </ContextMenu.Button>
        );
    }

    function renderInsight() {
        return (
            <ChartInsight numOfAnalyses={numOfAnalyses} chartType={chartType} data={chartData} analysisType={analysisType}/>
        );
    }

    function renderSaveChartPopover(anchor: HTMLElement | null) {
        if (!anchor || !saveChartPopoverOpen) {
            return null;
        }

        return (
            <SaveChartPopover
                anchor={anchor}
                offset={5}
                chartName={title}
                chartDescription={description as string}
                onSave={handleSave}
                onCancel={() => setSaveChartPopoverOpen(false)}/>
        );
    }

    return (
        <DashboardChart
            workspaceSlug={workspaceSlug}
            numOfAnalyses={numOfAnalyses}
            data={chartData}
            projectMap={projectMap}
            tagMap={tagMap}
            title={title}
            description={description}
            analysisType={analysisType}
            analysisSubject={analysisSubject}
            breakdownType={breakdownType}
            timeSeriesFilter={timeSeriesFilter}
            link={getLink()}
            linksDisabled={linksDisabled}
            readOnly={readOnly}
            contextMenuItems={renderContextMenuItems()}
            emptyStateMessage={emptyStateMessage}
            insight={renderInsight()}
            renderSaveChartPopover={renderSaveChartPopover}/>
    );
}

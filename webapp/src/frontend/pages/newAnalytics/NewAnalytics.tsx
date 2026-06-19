import { useEffect, useMemo, useRef, useState } from "react";

import LZString from "lz-string";
import { generatePath, Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AnalysisSubject, toAnalysisSubject } from "../../../common/models/AnalysisSubject";
import { AnalysisType, toAnalysisType } from "../../../common/models/AnalysisType";
import { toBreakdownType, BreakdownType } from "../../../common/models/BreakdownType";
import { type Filter } from "../../../common/models/Filter";
import { type TimeSeriesFilter, DEFAULT_TIME_SERIES_FILTER, toTimeSeriesFilter } from "../../../common/models/TimeSeriesFilter";
import { RoutePath } from "../../../common/RoutePath";
import { createSavedChart } from "../../api/api";
import { SaveChartPopover } from "../../common/SaveChartPopover/SaveChartPopover";
import { Analytics } from "../../containers/analytics/Analytics";
import { Button } from "../../library/Button/Button";
import { IconBookmark } from "../../library/icons/IconBookmark";
import { useToast } from "../../library/Toast/Toast";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { getHumanReadableSlug } from "../../models/SavedChart";
import { useDataCacheStore } from "../../providers/DataCacheProvider/DataCacheProvider";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { alertError } from "../../utils";
import { findPredefinedChart } from "../popularCharts/constants";

export function NewAnalytics() {
    const { workspaceSlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    const saveChartButtonRef = useRef<HTMLButtonElement>(null);
    const [saveChartPopoverOpen, setSaveChartPopoverOpen] = useState(false);

    const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.LatestData);
    const [analysisSubject, setAnalysisSubject] = useState<AnalysisSubject>();
    const [customProperty, setCustomProperty] = useState<string>();
    const [filters, setFilters] = useState<Filter[]>([]);
    const [timeSeriesFilter, setTimeSeriesFilter] = useState<TimeSeriesFilter | undefined>(DEFAULT_TIME_SERIES_FILTER);
    const [breakdownType, setBreakdownType] = useState<BreakdownType>();

    const {
        actions: { setAnalyticsURL },
        selectors: { getWorkspace, getAccessLevel, getTags },
    } = useStore();

    const tags = getTags();
    const equivalentPredefinedChart = useMemo(
        () => findPredefinedChart(tags, analysisType, analysisSubject, filters, breakdownType),
        [tags, analysisType, analysisSubject, filters, breakdownType]
    );

    const workspace = getWorkspace();
    const accessLevel = getAccessLevel();

    const { actions: { addSavedChartData } } = useDataCacheStore();

    function handleAnalysisTypeChange(newAnalysisType: AnalysisType) {
        const newSearchParams = new URLSearchParams(searchParams);

        if (newAnalysisType === AnalysisType.LatestData) {
            newSearchParams.delete("type");
            newSearchParams.delete("timeSeriesFilter");
        } else {
            newSearchParams.set("type", newAnalysisType);
            newSearchParams.set("timeSeriesFilter", LZString.compressToEncodedURIComponent(JSON.stringify(DEFAULT_TIME_SERIES_FILTER)));
            newSearchParams.delete("breakdown");
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    function handleAnalysisSubjectChange(newAnalysisSubject: AnalysisSubject, customProperty?: string) {
        const newSearchParams = new URLSearchParams(searchParams);

        newSearchParams.set("subject", newAnalysisSubject);

        if (customProperty) {
            newSearchParams.set("customProperty", customProperty);
        } else {
            newSearchParams.delete("customProperty");
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    function handleFiltersChange(newFilters: Filter[]) {
        const newSearchParams = new URLSearchParams(searchParams);

        if (newFilters.length) {
            newSearchParams.set("filters", LZString.compressToEncodedURIComponent(JSON.stringify(newFilters)));
        } else {
            newSearchParams.delete("filters");
        }

        if (analysisSubject === undefined) {
            newSearchParams.set("subject", AnalysisSubject.Components);
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    function handleBreakdownTypeChange(newBreakdownType: BreakdownType | undefined, breakdownCustomProperty?: string) {
        const newSearchParams = new URLSearchParams(searchParams);

        if (newBreakdownType) {
            newSearchParams.set("breakdown", newBreakdownType);
        } else {
            newSearchParams.delete("breakdown");
        }

        // Breaking down by a custom property reuses the `customProperty` param
        // (only the custom-property analysis subject uses it otherwise).
        if (analysisSubject !== AnalysisSubject.CustomProperties) {
            if (newBreakdownType === BreakdownType.CustomProperty && breakdownCustomProperty) {
                newSearchParams.set("customProperty", breakdownCustomProperty);
            } else {
                newSearchParams.delete("customProperty");
            }
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    function handleTimeSeriesFilterChange(newTimeSeriesFilter: TimeSeriesFilter | undefined) {
        const newSearchParams = new URLSearchParams(searchParams);

        if (newTimeSeriesFilter) {
            newSearchParams.set("timeSeriesFilter", LZString.compressToEncodedURIComponent(JSON.stringify(newTimeSeriesFilter)));
        } else {
            newSearchParams.delete("timeSeriesFilter");
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    async function handleChartSave(name: string, description: string) {
        try {
            setSaveChartPopoverOpen(false);

            const savedChart = await createSavedChart(workspaceSlug!, {
                name,
                description,
                analysisType,
                analysisSubject: analysisSubject!,
                customProperty,
                filters,
                breakdownType,
                timeSeriesFilter,
            });

            addSavedChartData(savedChart);

            const savedChartLink = generatePath(RoutePath.SavedChart, {
                workspaceSlug: workspaceSlug!,
                savedChartSlug: getHumanReadableSlug(savedChart.name, savedChart.slug),
            });

            navigate(savedChartLink);

            toast.show(
                <>
                    <span>Chart saved to dashboard&nbsp;•&nbsp;</span>
                    <Link
                        to={generatePath(RoutePath.SavedCharts, { workspaceSlug: workspaceSlug! })}
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

    useEffect(() => {
        setAnalysisType(toAnalysisType(searchParams.get("type")));

        const newAnalysisSubject = toAnalysisSubject(searchParams.get("subject"));
        setAnalysisSubject(newAnalysisSubject);

        const newCustomProperty = searchParams.get("customProperty") ?? undefined;
        setCustomProperty(newCustomProperty);

        // A custom-property breakdown is meaningless without a property to group by.
        let newBreakdownType = toBreakdownType(searchParams.get("breakdown"), newAnalysisSubject);
        if (newBreakdownType === BreakdownType.CustomProperty && !newCustomProperty) {
            newBreakdownType = undefined;
        }
        setBreakdownType(newBreakdownType);
        setTimeSeriesFilter(toTimeSeriesFilter(searchParams.get("timeSeriesFilter")));

        const filtersParam = searchParams.get("filters");
        let newFilters: Filter[] = [];
        if (filtersParam) {
            try {
                newFilters = JSON.parse(LZString.decompressFromEncodedURIComponent(filtersParam)) as Filter[];
            } catch {
                newFilters = [];
            }
        }
        setFilters(newFilters);

        const pathname = generatePath(RoutePath.NewAnalytics, { workspaceSlug: workspaceSlug! });
        setAnalyticsURL(`${pathname}?${searchParams.toString()}`);
    }, [searchParams]);

    function getTitle() {
        if (equivalentPredefinedChart?.title) {
            return equivalentPredefinedChart.title;
        }

        if (analysisType === AnalysisType.LatestData) {
            switch (analysisSubject) {
                case AnalysisSubject.Components:
                    return "Components sorted by usage";
                case AnalysisSubject.Projects:
                    return "Component usage by project";
                case AnalysisSubject.Tags:
                    return "Component usage by tag";
                case AnalysisSubject.CustomProperties:
                    return `Component usage by “${customProperty}” property`;
            }
        } else {
            switch (analysisSubject) {
                case AnalysisSubject.Components:
                    return "Component usage over time";
                case AnalysisSubject.Projects:
                    return "Component usage over time by project";
                case AnalysisSubject.Tags:
                    return "Component usage over time by tag";
                case AnalysisSubject.CustomProperties:
                    return `Component usage over time by “${customProperty}” property`;
            }
        }

        return "";
    }

    function getDescription() {
        if (equivalentPredefinedChart?.description) {
            return equivalentPredefinedChart.description;
        }

        if (analysisType === AnalysisType.LatestData) {
            switch (analysisSubject) {
                case AnalysisSubject.Components:
                    return "Total number of usages across all projects for each component";
                case AnalysisSubject.Projects:
                    return "Total number of component usages for each project";
                case AnalysisSubject.Tags:
                    return "Total number of component usages for each tag";
                case AnalysisSubject.CustomProperties:
                    return `Total number of component usages for each “${customProperty}”`;
            }
        } else {
            switch (analysisSubject) {
                case AnalysisSubject.Components:
                    return "Change in number of usages for each component";
                case AnalysisSubject.Projects:
                    return "Change in number of component usages for each project";
                case AnalysisSubject.Tags:
                    return "Comparison of usage change for each tag";
                case AnalysisSubject.CustomProperties:
                    return `Change in number of component usages for each “${customProperty}”`;
            }
        }

        return "";
    }

    function renderSaveButton() {
        return (
            <Button
                ref={saveChartButtonRef}
                active={saveChartPopoverOpen}
                icon={<IconBookmark/>}
                title={accessLevel === AccessLevel.ReadOnly ? "Saving charts not available in demo workspace" : undefined}
                onClick={() => setSaveChartPopoverOpen(true)}
                disabled={accessLevel === AccessLevel.ReadOnly || !analysisType || !analysisSubject}>
                Save
            </Button>
        );
    }

    return (
        <>
            <Analytics
                numOfAnalyses={workspace?.numOfAnalyses ?? 0}
                analysisType={analysisType}
                analysisSubject={analysisSubject}
                customProperty={customProperty}
                filters={filters}
                breakdownType={breakdownType}
                timeSeriesFilter={timeSeriesFilter}
                titleText={getTitle()}
                title={getTitle()}
                description={getDescription()}
                chartActions={renderSaveButton()}
                equivalentPredefinedChartType={equivalentPredefinedChart?.chartType}
                onAnalysisTypeChange={handleAnalysisTypeChange}
                onAnalysisSubjectChange={handleAnalysisSubjectChange}
                onFiltersChange={handleFiltersChange}
                onBreakdownTypeChange={handleBreakdownTypeChange}
                onTimeSeriesFilterChange={handleTimeSeriesFilterChange}/>
            {saveChartPopoverOpen && (
                <SaveChartPopover
                    anchor={saveChartButtonRef.current!}
                    chartName={getTitle()}
                    chartDescription={getDescription()}
                    onSave={handleChartSave}
                    onCancel={() => setSaveChartPopoverOpen(false)}/>
            )}
        </>
    );
}

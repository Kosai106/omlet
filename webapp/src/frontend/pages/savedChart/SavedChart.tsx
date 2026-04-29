import { useEffect, useMemo, useRef, useState } from "react";

import LZString from "lz-string";
import { Link, generatePath, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { AnalysisType } from "../../../common/models/AnalysisType";
import { type BreakdownType } from "../../../common/models/BreakdownType";
import { type Filter, hasSameFilters } from "../../../common/models/Filter";
import {
    type TimeSeriesFilter,
    hasSameTimeSeriesFilters,
    DEFAULT_TIME_SERIES_FILTER,
    toTimeSeriesFilter,
} from "../../../common/models/TimeSeriesFilter";
import { RoutePath } from "../../../common/RoutePath";
import { createSavedChart, getSavedChart, updateSavedChart, deleteSavedChart } from "../../api/api";
import { type SaveChartPopoverProps, SaveChartPopoverAction, SaveChartPopover } from "../../common/SaveChartPopover/SaveChartPopover";
import { Analytics } from "../../containers/analytics/Analytics";
import { Button, ButtonKind } from "../../library/Button/Button";
import { ContextMenu, MenuAlignment, MenuItemKind } from "../../library/ContextMenu/ContextMenu";
import { IconBookmark } from "../../library/icons/IconBookmark";
import { IconCheck } from "../../library/icons/IconCheck";
import { NinjaInput } from "../../library/NinjaInput/NinjaInput";
import { useToast } from "../../library/Toast/Toast";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import {
    type SavedChart as SavedChartModel,
    getHumanReadableSlug,
    getNameForCopy,
    SAVED_CHART_NAME_MAX_LENGTH,
    SAVED_CHART_DESCRIPTION_MAX_LENGTH,
} from "../../models/SavedChart";
import { useDataCacheStore } from "../../providers/DataCacheProvider/DataCacheProvider";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { alertError } from "../../utils";

import classes from "./SavedChart.module.css";

export function SavedChart() {
    const { workspaceSlug, savedChartSlug: humanReadableSlug } = useParams();
    const [savedChartNameSlug, savedChartSlug] = useMemo(() => {
        if (!humanReadableSlug) {
            return [];
        }

        if (!humanReadableSlug.includes("--")) {
            return [undefined, humanReadableSlug];
        }

        return humanReadableSlug.split("--");
    }, [humanReadableSlug]);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const toast = useToast();

    const saveAsNewButtonRef = useRef<HTMLButtonElement>(null);
    const savedChartButtonRef = useRef<HTMLButtonElement>(null);

    const [saveChartPopoverProps, setSaveChartPopoverProps] = useState<Omit<SaveChartPopoverProps, "onCancel">>();
    const [savedChartContextMenuOpen, setSavedChartContextMenuOpen] = useState<boolean>(false);
    const [savedChart, setSavedChart] = useState<SavedChartModel>();

    const [overriddenAnalysisType, setOverriddenAnalysisType] = useState<AnalysisType>();
    const [overriddenAnalysisSubject, setOverriddenAnalysisSubject] = useState<AnalysisSubject>();
    const [overriddenCustomProperty, setOverriddenCustomProperty] = useState<string>();
    const [overriddenFilters, setOverriddenFilters] = useState<Filter[]>();
    const [overriddenBreakdownType, setOverriddenBreakdownType] = useState<BreakdownType | null>();
    const [overriddenTimeSeriesFilter, setOverriddenTimeSeriesFilter] = useState<TimeSeriesFilter | undefined>();

    const {
        selectors: { getWorkspace, getAccessLevel },
        actions: { setAnalyticsURL },
    } = useStore();
    const { actions: { addSavedChartData, updateSavedChartData, removeSavedChartData } } = useDataCacheStore();

    const workspace = getWorkspace();
    const accessLevel = getAccessLevel();

    function getAnalysisType() {
        return overriddenAnalysisType ?? savedChart!.analysisType;
    }

    function getAnalysisSubject() {
        return overriddenAnalysisSubject ?? savedChart!.analysisSubject;
    }

    function getCustomProperty() {
        if (getAnalysisSubject() !== AnalysisSubject.CustomProperties) {
            return undefined;
        }

        return overriddenCustomProperty ?? savedChart!.customProperty;
    }

    function getFilters() {
        return overriddenFilters ?? savedChart!.filters;
    }

    function getBreakdownType() {
        if (overriddenBreakdownType === null) {
            return undefined;
        }

        return overriddenBreakdownType ?? savedChart!.breakdownType;
    }

    function getTimeSeriesFilter() {
        return overriddenTimeSeriesFilter ?? savedChart!.timeSeriesFilter ?? DEFAULT_TIME_SERIES_FILTER;
    }

    function showToast(message: string) {
        toast.show(
            <>
                <span>{message}&nbsp;•&nbsp;</span>
                <Link
                    to={generatePath(RoutePath.SavedCharts, { workspaceSlug: workspaceSlug! })}
                    onClick={() => toast.hide()}>
                    Go to Saved Dashboard
                </Link>
            </>,
            10000
        );
    }

    function handleAnalysisTypeChange(analysisType: AnalysisType) {
        const newOverriddenAnalysisType = analysisType === savedChart!.analysisType ? undefined : analysisType;
        const newSearchParams = new URLSearchParams(searchParams);

        if (newOverriddenAnalysisType) {
            newSearchParams.set("type", newOverriddenAnalysisType);
            if (newOverriddenAnalysisType === AnalysisType.DataOverTime) {
                newSearchParams.set("breakdown", "null");
            }
        } else {
            newSearchParams.delete("type");
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    function handleAnalysisSubjectChange(analysisSubject: AnalysisSubject, customProperty?: string) {
        const newSearchParams = new URLSearchParams(searchParams);

        const newOverriddenAnalysisSubject = analysisSubject === savedChart!.analysisSubject ? undefined : analysisSubject;
        if (newOverriddenAnalysisSubject) {
            newSearchParams.set("subject", newOverriddenAnalysisSubject);
        } else {
            newSearchParams.delete("subject");
        }

        const newOverriddenCustomProperty = customProperty === savedChart!.customProperty ? undefined : customProperty;
        if (newOverriddenCustomProperty) {
            newSearchParams.set("customProperty", newOverriddenCustomProperty);
        } else {
            newSearchParams.delete("customProperty");
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    function handleFiltersChange(filters: Filter[]) {
        const newOverriddenFilters = hasSameFilters(filters, savedChart!.filters) ? undefined : filters;
        const newSearchParams = new URLSearchParams(searchParams);

        if (newOverriddenFilters) {
            newSearchParams.set("filters", LZString.compressToEncodedURIComponent(JSON.stringify(newOverriddenFilters)));
        } else {
            newSearchParams.delete("filters");
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    function handleTimeSeriesFilterChange(timeSeriesFilter: TimeSeriesFilter) {
        const isSameTimeSeriesFilter = hasSameTimeSeriesFilters(timeSeriesFilter, savedChart?.timeSeriesFilter);
        const newOverriddenTimeSeriesFilter = isSameTimeSeriesFilter ? undefined : timeSeriesFilter;

        const newSearchParams = new URLSearchParams(searchParams);

        if (newOverriddenTimeSeriesFilter) {
            newSearchParams.set("timeSeriesFilter", LZString.compressToEncodedURIComponent(JSON.stringify(newOverriddenTimeSeriesFilter)));
        } else {
            newSearchParams.delete("timeSeriesFilter");
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    function handleBreakdownTypeChange(breakdownType: BreakdownType | undefined) {
        let newOverriddenBreakdownType: BreakdownType | undefined | null = undefined;
        if (breakdownType === savedChart!.breakdownType) {
            newOverriddenBreakdownType = undefined;
        } else if (breakdownType === undefined) {
            newOverriddenBreakdownType = null;
        } else {
            newOverriddenBreakdownType = breakdownType;
        }

        const newSearchParams = new URLSearchParams(searchParams);

        if (newOverriddenBreakdownType === null) {
            newSearchParams.set("breakdown", "null");
        } else if (newOverriddenBreakdownType) {
            newSearchParams.set("breakdown", newOverriddenBreakdownType);
        } else {
            newSearchParams.delete("breakdown");
        }

        setSearchParams(newSearchParams, { replace: true });
    }

    async function handleSaveAsNew(name: string, description: string) {
        try {
            setSaveChartPopoverProps(undefined);
            const savedTimeSeriesFilter = getAnalysisType() === AnalysisType.DataOverTime ? getTimeSeriesFilter() : undefined;

            const newSavedChart = await createSavedChart(workspaceSlug!, {
                name,
                description,
                analysisType: getAnalysisType(),
                analysisSubject: getAnalysisSubject(),
                customProperty: getCustomProperty(),
                filters: getFilters(),
                breakdownType: getBreakdownType(),
                timeSeriesFilter: savedTimeSeriesFilter,
            });

            const newSavedChartLink = generatePath(RoutePath.SavedChart, {
                workspaceSlug: workspaceSlug!,
                savedChartSlug: getHumanReadableSlug(newSavedChart.name, newSavedChart.slug),
            });

            navigate(newSavedChartLink);
            setSavedChart(newSavedChart);
            addSavedChartData(newSavedChart);
            showToast("Chart saved to dashboard");
        } catch (error) {
            logError(error);
            alertError(error as Error);
        }
    }

    async function handleChartNameChange(name: string) {
        try {
            await updateSavedChart(workspaceSlug!, savedChartSlug, { name });

            const updatedSavedChartLink = generatePath(RoutePath.SavedChart, {
                workspaceSlug: workspaceSlug!,
                savedChartSlug: getHumanReadableSlug(name, savedChartSlug),
            });

            navigate(updatedSavedChartLink, { replace: true });
            setSavedChart(chart => ({ ...chart!, name }));
            updateSavedChartData(savedChartSlug, { name });
            showToast("Chart updated");
        } catch (error) {
            logError(error);
        }
    }

    async function handleChartDescriptionChange(description: string) {
        try {
            await updateSavedChart(workspaceSlug!, savedChartSlug, { description });

            setSavedChart(chart => ({ ...chart!, description }));
            updateSavedChartData(savedChartSlug, { description });
            showToast("Chart updated");
        } catch (error) {
            logError(error);
        }
    }

    async function handleUpdateInfo(name: string, description: string) {
        try {
            setSaveChartPopoverProps(undefined);

            await updateSavedChart(workspaceSlug!, savedChartSlug, { name, description });

            const updatedSavedChartLink = generatePath(RoutePath.SavedChart, {
                workspaceSlug: workspaceSlug!,
                savedChartSlug: getHumanReadableSlug(name, savedChartSlug),
            });

            navigate(updatedSavedChartLink, { replace: true });
            setSavedChart(chart => ({ ...chart!, name, description }));
            updateSavedChartData(savedChartSlug, { name, description });
            setSearchParams(new URLSearchParams(), { replace: true });
            showToast("Chart updated");
        } catch (error) {
            logError(error);
        }
    }

    async function handleUpdateConfig() {
        try {
            await updateSavedChart(workspaceSlug!, savedChartSlug, {
                analysisType: overriddenAnalysisType,
                analysisSubject: overriddenAnalysisSubject,
                customProperty: getCustomProperty(),
                filters: overriddenFilters,
                breakdownType: overriddenBreakdownType,
                timeSeriesFilter: overriddenTimeSeriesFilter,
            });

            const update = {
                analysisType: getAnalysisType(),
                analysisSubject: getAnalysisSubject(),
                customProperty: getCustomProperty(),
                filters: getFilters(),
                breakdownType: getBreakdownType(),
                timeSeriesFilter: getTimeSeriesFilter(),
            };

            setSavedChart(chart => ({
                ...chart!,
                ...update,
            }));

            updateSavedChartData(savedChartSlug, update);

            setSearchParams(new URLSearchParams(), { replace: true });
            showToast("Chart updated");
        } catch (error) {
            logError(error);
        }
    }

    function handleEditButtonClick() {
        setSavedChartContextMenuOpen(false);

        setSaveChartPopoverProps({
            anchor: savedChartButtonRef.current!,
            action: SaveChartPopoverAction.Update,
            chartName: savedChart!.name,
            chartDescription: savedChart!.description,
            onSave: handleUpdateInfo,
        });
    }

    async function handleRemoveButtonClick() {
        try {
            setSavedChartContextMenuOpen(false);

            if (window.confirm(`Remove “${savedChart!.name}” from dashboard?`)) {
                await deleteSavedChart(workspaceSlug!, savedChartSlug);

                removeSavedChartData(savedChartSlug);

                const searchParams = new URLSearchParams();

                if (savedChart!.analysisType !== AnalysisType.LatestData) {
                    searchParams.set("type", savedChart!.analysisType);
                }

                searchParams.set("subject", savedChart!.analysisSubject);

                if (savedChart!.filters.length !== 0) {
                    searchParams.set("filters", LZString.compressToEncodedURIComponent(JSON.stringify(savedChart!.filters)));
                }

                if (savedChart!.breakdownType !== undefined) {
                    searchParams.set("breakdown", savedChart!.breakdownType);
                }

                if (savedChart?.timeSeriesFilter !== undefined) {
                    searchParams.set("timeSeriesFilter", LZString.compressToEncodedURIComponent(JSON.stringify(savedChart.timeSeriesFilter)));
                }

                navigate({
                    pathname: generatePath(RoutePath.NewAnalytics, { workspaceSlug: workspaceSlug! }),
                    search: searchParams.toString(),
                }, {
                    replace: true,
                });

                showToast("Chart removed from dashboard");
            }
        } catch (error) {
            logError(error);
        }
    }

    useEffect(() => {
        if (!savedChart || savedChartNameSlug) {
            return;
        }

        // redirect to human readable URL
        const humanReadableSavedChartLink = generatePath(RoutePath.SavedChart, {
            workspaceSlug: workspaceSlug!,
            savedChartSlug: getHumanReadableSlug(savedChart.name, savedChart.slug),
        });

        navigate(humanReadableSavedChartLink, { replace: true });
    }, [savedChart, savedChartNameSlug]);

    useEffect(() => {
        if (overriddenAnalysisType === AnalysisType.DataOverTime) {
            handleTimeSeriesFilterChange(DEFAULT_TIME_SERIES_FILTER);
        }
    }, [overriddenAnalysisType]);

    useEffect(() => {
        async function fetchData() {
            try {
                const savedChartResponse = await getSavedChart(workspaceSlug!, savedChartSlug);
                setSavedChart(savedChartResponse);
            } catch (error) {
                logError(error);
                navigate(generatePath(RoutePath.Dashboard, { workspaceSlug: workspaceSlug! }));
            }
        }

        fetchData();
    }, [workspaceSlug, savedChartSlug]);

    useEffect(() => {
        if (!savedChart) {
            return;
        }

        const analysisType = (searchParams.get("type") ?? undefined) as AnalysisType | undefined;
        const newOverriddenAnalysisType = analysisType === savedChart.analysisType ? undefined : analysisType;
        setOverriddenAnalysisType(newOverriddenAnalysisType);

        const analysisSubject = (searchParams.get("subject") ?? undefined) as AnalysisSubject | undefined;
        let newOverriddenAnalysisSubject = analysisSubject === savedChart.analysisSubject ? undefined : analysisSubject;

        const customProperty = searchParams.get("customProperty") ?? undefined;
        let newOverriddenCustomProperty: string | undefined = undefined;

        if (newOverriddenAnalysisSubject === AnalysisSubject.CustomProperties) {
            if (!customProperty) {
                newOverriddenAnalysisSubject = savedChart.analysisSubject;
            }

            newOverriddenCustomProperty = customProperty;
        } else if (newOverriddenAnalysisSubject === undefined && savedChart.analysisSubject === AnalysisSubject.CustomProperties) {
            newOverriddenCustomProperty = customProperty === savedChart.customProperty ? undefined : customProperty;
        }
        setOverriddenAnalysisSubject(newOverriddenAnalysisSubject);
        setOverriddenCustomProperty(newOverriddenCustomProperty);

        const timeSeriesFilter = toTimeSeriesFilter(searchParams.get("timeSeriesFilter"));
        const isSameTimeSeriesFilter = hasSameTimeSeriesFilters(timeSeriesFilter, savedChart?.timeSeriesFilter);
        const newOverriddenTimeSeriesFilter = isSameTimeSeriesFilter ? undefined : timeSeriesFilter;
        setOverriddenTimeSeriesFilter(newOverriddenTimeSeriesFilter);

        const filtersParam = searchParams.get("filters");
        let newOverriddenFilters: Filter[] | undefined = undefined;
        if (filtersParam) {
            try {
                const filters = JSON.parse(LZString.decompressFromEncodedURIComponent(filtersParam)) as Filter[];
                newOverriddenFilters = hasSameFilters(filters, savedChart.filters) ? undefined : filters;
            } catch {
                newOverriddenFilters = undefined;
            }
        }
        setOverriddenFilters(newOverriddenFilters);

        const breakdown = searchParams.get("breakdown");
        let newOverriddenBreakdownType: BreakdownType | undefined | null = undefined;
        if (breakdown === null) {
            newOverriddenBreakdownType = undefined;
        } else if (breakdown === "null") {
            if (savedChart.breakdownType === undefined) {
                newOverriddenBreakdownType = undefined;
            } else {
                newOverriddenBreakdownType = null;
            }
        } else if (breakdown === savedChart.breakdownType) {
            newOverriddenBreakdownType = undefined;
        } else {
            newOverriddenBreakdownType = breakdown as BreakdownType;
        }
        setOverriddenBreakdownType(newOverriddenBreakdownType);

        const humanReadableSlug = getHumanReadableSlug(savedChart.name, savedChartSlug);
        const pathname = generatePath(RoutePath.SavedChart, { workspaceSlug: workspaceSlug!, savedChartSlug: humanReadableSlug });
        setAnalyticsURL(`${pathname}?${searchParams.toString()}`);
    }, [savedChart, searchParams]);

    function renderChartTitle() {
        return (
            <NinjaInput
                className={classes.chartNameInput}
                placeholder="Chart name"
                value={savedChart!.name}
                maxLength={SAVED_CHART_NAME_MAX_LENGTH}
                readOnly={accessLevel !== AccessLevel.Full}
                required
                onChange={handleChartNameChange}/>
        );
    }

    function renderChartDescription() {
        return (
            <NinjaInput
                className={classes.chartDescriptionInput}
                placeholder="No description yet"
                value={savedChart!.description}
                maxLength={SAVED_CHART_DESCRIPTION_MAX_LENGTH}
                readOnly={accessLevel !== AccessLevel.Full}
                onChange={handleChartDescriptionChange}/>
        );
    }

    function renderChartActions() {
        if (
            accessLevel === AccessLevel.Full &&
            (
                overriddenAnalysisType !== undefined ||
                overriddenAnalysisSubject !== undefined ||
                overriddenFilters !== undefined ||
                overriddenBreakdownType !== undefined ||
                overriddenTimeSeriesFilter !== undefined
            )
        ) {
            return (
                <>
                    <Button
                        ref={saveAsNewButtonRef}
                        kind={ButtonKind.Secondary}
                        active={saveChartPopoverProps !== undefined}
                        icon={<IconBookmark/>}
                        onClick={() => setSaveChartPopoverProps({
                            anchor: saveAsNewButtonRef.current!,
                            action: SaveChartPopoverAction.Save,
                            chartName: getNameForCopy(savedChart!.name),
                            chartDescription: savedChart!.description,
                            onSave: handleSaveAsNew,
                        })}>
                        Save as new
                    </Button>
                    <Button
                        icon={<IconBookmark/>}
                        onClick={handleUpdateConfig}>
                        Update
                    </Button>
                </>
            );
        }

        return (
            <Button
                ref={savedChartButtonRef}
                active={saveChartPopoverProps !== undefined}
                icon={<IconCheck/>}
                onClick={accessLevel === AccessLevel.Full ? () => setSavedChartContextMenuOpen(true) : undefined}>
                Saved
            </Button>
        );
    }

    if (!savedChart) {
        return null;
    }

    return (
        <>
            <Analytics
                numOfAnalyses={workspace?.numOfAnalyses ?? 0}
                analysisType={getAnalysisType()}
                analysisSubject={getAnalysisSubject()}
                customProperty={getCustomProperty()}
                filters={getFilters()}
                breakdownType={getBreakdownType()}
                timeSeriesFilter={getTimeSeriesFilter()}
                titleText={savedChart.name}
                title={renderChartTitle()}
                description={renderChartDescription()}
                chartActions={renderChartActions()}
                onAnalysisTypeChange={handleAnalysisTypeChange}
                onAnalysisSubjectChange={handleAnalysisSubjectChange}
                onFiltersChange={handleFiltersChange}
                onBreakdownTypeChange={handleBreakdownTypeChange}
                onTimeSeriesFilterChange={handleTimeSeriesFilterChange}/>
            {saveChartPopoverProps && (
                <SaveChartPopover
                    {...saveChartPopoverProps}
                    onCancel={() => setSaveChartPopoverProps(undefined)}/>
            )}
            {savedChartContextMenuOpen && (
                <ContextMenu
                    anchorRect={savedChartButtonRef.current!.getBoundingClientRect()}
                    alignment={MenuAlignment.Right}
                    onClose={() => setSavedChartContextMenuOpen(false)}>
                    <ContextMenu.Button
                        onClick={handleEditButtonClick}>
                        Edit name &amp; description
                    </ContextMenu.Button>
                    <ContextMenu.Separator/>
                    <ContextMenu.Button
                        kind={MenuItemKind.Critical}
                        onClick={handleRemoveButtonClick}>
                        Remove from dashboard
                    </ContextMenu.Button>
                </ContextMenu>
            )}
        </>
    );
}

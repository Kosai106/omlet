import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import { generatePath, useParams } from "react-router-dom";

import { RESERVED_TAGS } from "../../../common/models/Tag";
import { DEFAULT_TIME_SERIES_FILTER } from "../../../common/models/TimeSeriesFilter";
import { RoutePath } from "../../../common/RoutePath";
import { deleteSavedChart, getSavedCharts, updateSavedChart } from "../../api/api";
import { Loading } from "../../library/Loading/Loading";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { useDataCacheStore } from "../../providers/DataCacheProvider/DataCacheProvider";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { DashboardSection } from "../popularCharts/dashboardSection/DashboardSection";
import { DashboardSectionHeader } from "../popularCharts/dashboardSectionHeader/DashboardSectionHeader";

import { EmptyState } from "./emptyState/EmptyState";
import { SavedDashboardChart } from "./savedDashboardChart/SavedDashboardChart";

import classes from "./SavedCharts.module.css";

export function SavedCharts() {
    const { workspaceSlug } = useParams();

    const [isLoading, setIsLoading] = useState(false);

    const {
        selectors: { getTags, getWorkspace, getAccessLevel },
        actions: { setAnalyticsURL, setDashboardURL },
    } = useStore();

    const workspace = getWorkspace()!;
    const accessLevel = getAccessLevel();
    const projects = workspace.projects ?? [];
    const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p.packageName, p])), [projects]);
    const tags = getTags();
    const allTags = [...tags, RESERVED_TAGS.UNTAGGED];
    const tagMap = useMemo(() => Object.fromEntries(allTags.map(t => [t.slug, t])), [tags]);

    const {
        selectors: { getSavedChartsData },
        actions: { setSavedChartsData, updateSavedChartData, removeSavedChartData },
    } = useDataCacheStore();

    const savedCharts = getSavedChartsData();

    async function handleUpdateInfo(slug: string, name: string, description: string) {
        try {
            await updateSavedChart(workspaceSlug!, slug, { name, description });

            updateSavedChartData(slug, { name, description });
        } catch (error) {
            logError(error);
        }
    }

    async function handleRemove(slug: string, title: string) {
        try {
            if (window.confirm(`Remove “${title}” from dashboard?`)) {
                await deleteSavedChart(workspaceSlug!, slug);

                removeSavedChartData(slug);
            }
        } catch (error) {
            logError(error);
        }
    }

    useEffect(() => {
        async function fetchData() {
            if (!workspaceSlug || savedCharts) {
                return;
            }

            try {
                setIsLoading(true);

                const savedChartsData = await getSavedCharts(workspaceSlug);

                setSavedChartsData(savedChartsData);
                setIsLoading(false);
            } catch (error) {
                logError(error);
            }
        }

        fetchData();
    }, [workspaceSlug]);

    useLayoutEffect(() => {
        const savedDashboardURL = generatePath(RoutePath.SavedCharts, { workspaceSlug: workspaceSlug! });
        setAnalyticsURL(savedDashboardURL);
        setDashboardURL(savedDashboardURL);
    }, []);

    function renderSavedCharts() {
        if (isLoading) {
            return <Loading className={classes.loading}/>;
        }

        if (!savedCharts) {
            return null;
        }

        if (savedCharts.length === 0) {
            return <EmptyState workspaceSlug={workspaceSlug!}/>;
        }

        return (
            savedCharts.map(savedChart => (
                <SavedDashboardChart
                    key={savedChart.slug}
                    slug={savedChart.slug}
                    workspace={workspace}
                    numOfAnalyses={workspace?.numOfAnalyses ?? 0}
                    tagMap={tagMap}
                    projectMap={projectMap}
                    title={savedChart.name}
                    description={savedChart.description}
                    analysisType={savedChart.analysisType}
                    analysisSubject={savedChart.analysisSubject}
                    customProperty={savedChart.customProperty}
                    timeSeriesFilter={savedChart.timeSeriesFilter ?? DEFAULT_TIME_SERIES_FILTER}
                    filters={savedChart.filters}
                    breakdownType={savedChart.breakdownType}
                    linksDisabled={accessLevel === AccessLevel.Page}
                    readOnly={accessLevel !== AccessLevel.Full}
                    onUpdateInfo={handleUpdateInfo}
                    onRemove={handleRemove}/>
            ))
        );
    }

    return (
        <main className={classes.savedCharts}>
            <DashboardSection
                header={
                    <DashboardSectionHeader
                        title="Saved dashboard"
                        description={`Collection of charts ${workspace?.name ?? workspaceSlug} members configured and saved`}/>
                }
                children={renderSavedCharts()}/>
        </main>
    );
}

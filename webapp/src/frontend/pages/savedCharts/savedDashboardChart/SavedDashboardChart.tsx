import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { generatePath } from "react-router-dom";

import { type AnalysisSubject } from "../../../../common/models/AnalysisSubject";
import { type AnalysisType } from "../../../../common/models/AnalysisType";
import { type BreakdownType } from "../../../../common/models/BreakdownType";
import { type Filter } from "../../../../common/models/Filter";
import { type Project } from "../../../../common/models/Project";
import { type Tag } from "../../../../common/models/Tag";
import { type TimeSeriesFilter } from "../../../../common/models/TimeSeriesFilter";
import { RoutePath } from "../../../../common/RoutePath";
import { getDataAnalysis } from "../../../api/api";
import { DashboardChart } from "../../../common/DashboardChart/DashboardChart";
import { SaveChartPopover, SaveChartPopoverAction } from "../../../common/SaveChartPopover/SaveChartPopover";
import { ContextMenu, MenuItemKind } from "../../../library/ContextMenu/ContextMenu";
import { getHumanReadableSlug } from "../../../models/SavedChart";
import { type Workspace } from "../../../models/Workspace";

interface Props {
    workspace: Workspace;
    numOfAnalyses: number;
    slug: string;
    projectMap: Record<string, Project>;
    tagMap: Record<string, Tag>;
    analysisType: AnalysisType;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    timeSeriesFilter?: TimeSeriesFilter;
    filters: Filter[];
    breakdownType?: BreakdownType;
    title: string;
    description: string;
    linksDisabled: boolean;
    readOnly: boolean;
    onUpdateInfo(slug: string, name: string, description: string): void;
    onRemove(slug: string, name: string): void;
}

export function SavedDashboardChart({
    workspace,
    numOfAnalyses,
    tagMap,
    projectMap,
    slug,
    analysisType,
    analysisSubject,
    customProperty,
    filters,
    breakdownType,
    timeSeriesFilter,
    title,
    description,
    linksDisabled,
    readOnly,
    onUpdateInfo,
    onRemove,
}: Props) {
    const [saveChartPopoverOpen, setSaveChartPopoverOpen] = useState(false);

    function getLink() {
        return generatePath(RoutePath.SavedChart, {
            workspaceSlug: workspace.slug,
            savedChartSlug: getHumanReadableSlug(title, slug),
        });
    }

    async function handleUpdateInfo(name: string, description: string) {
        setSaveChartPopoverOpen(false);

        onUpdateInfo(slug, name, description);
    }

    async function handleRemoveMenuItemClick() {
        onRemove(slug, title);
    }

    const { data: chartData } = useQuery({
        queryKey: [
            workspace,
            analysisType,
            analysisSubject,
            customProperty,
            filters,
            timeSeriesFilter,
            breakdownType,
        ],
        queryFn({ signal }) {
            return getDataAnalysis({
                workspace,
                analysisType,
                analysisSubject,
                customProperty,
                filters,
                timeSeriesFilter,
                breakdownType,
            }, signal);
        },
    });

    function renderContextMenuItems() {
        if (readOnly) {
            return null;
        }

        return (
            <>
                <ContextMenu.Button
                    onClick={() => setSaveChartPopoverOpen(true)}>
                    Edit name &amp; description
                </ContextMenu.Button>
                <ContextMenu.Separator/>
                <ContextMenu.Button
                    kind={MenuItemKind.Critical}
                    onClick={handleRemoveMenuItemClick}>
                    Remove from dashboard
                </ContextMenu.Button>
            </>
        );
    }

    function renderSaveChartPopover(anchor: HTMLElement | null) {
        if (!anchor || !saveChartPopoverOpen) {
            return null;
        }

        return (
            <SaveChartPopover
                anchor={anchor}
                action={SaveChartPopoverAction.Update}
                offset={5}
                chartName={title}
                chartDescription={description}
                onSave={handleUpdateInfo}
                onCancel={() => setSaveChartPopoverOpen(false)}/>
        );
    }

    return (
        <DashboardChart
            workspaceSlug={workspace.slug}
            numOfAnalyses={numOfAnalyses}
            data={chartData}
            tagMap={tagMap}
            projectMap={projectMap}
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
            emptyStateMessage="No results with this selection."
            renderSaveChartPopover={renderSaveChartPopover}/>
    );
}

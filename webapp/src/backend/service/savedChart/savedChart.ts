import { type UpdateQuery } from "mongoose";

import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { AnalysisType } from "../../../common/models/AnalysisType";
import { type BreakdownType } from "../../../common/models/BreakdownType";
import { type Filter } from "../../../common/models/Filter";
import { type TimeSeriesFilter } from "../../../common/models/TimeSeriesFilter";
import { ServiceError } from "../error";
import { generateKeyBetween } from "../fractionalIndexing";
import { generateNanoId } from "../utils";
import { type Workspace } from "../workspace/workspace";

import { type SavedChartDoc, SavedChartModel } from "./models";

export class SavedChartNotFound extends ServiceError {
    constructor({ workspace, savedChart }: { workspace: string; savedChart: string; }) {
        super("Saved chart not found", {
            details: {
                workspace,
                savedChart,
            },
        });
    }
}

export class SavedChart {
    id: string;
    slug: string;
    workspace: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string;
    order: string;
    analysisType: AnalysisType;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    filters: Filter[];
    breakdownType?: BreakdownType;
    timeSeriesFilter?: TimeSeriesFilter;

    constructor(doc: SavedChartDoc) {
        this.id = doc._id.toHexString();
        this.slug = doc.slug;
        this.workspace = doc.workspace.toHexString();
        this.createdBy = doc.createdBy.toHexString();
        this.createdAt = doc.createdAt;
        this.updatedAt = doc.updatedAt;
        this.name = doc.name;
        this.description = doc.description;
        this.order = doc.order;
        this.analysisType = doc.analysisType;
        this.analysisSubject = doc.analysisSubject;
        this.customProperty = doc.customProperty;
        this.filters = doc.filters;
        this.breakdownType = doc.breakdownType;
        this.timeSeriesFilter = doc.timeSeriesFilter;
    }

    static fromDoc(doc: SavedChartDoc): SavedChart {
        return new SavedChart(doc);
    }

    toResponse() {
        return {
            id: this.id,
            slug: this.slug,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            name: this.name,
            description: this.description,
            order: this.order,
            analysisType: this.analysisType,
            analysisSubject: this.analysisSubject,
            customProperty: this.customProperty,
            filters: this.filters,
            breakdownType: this.breakdownType,
            timeSeriesFilter: this.timeSeriesFilter,
        };
    }
}

export interface CreateSavedChartParams {
    name: string;
    description?: string;
    analysisType: AnalysisType;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    filters: Filter[];
    breakdownType?: BreakdownType;
    timeSeriesFilter?: TimeSeriesFilter;
}

const SAVED_CHART_SLUG_LENGTH = 5;

export async function createSavedChart(workspace: Workspace, userId: string, {
    name,
    description,
    analysisType,
    analysisSubject,
    customProperty,
    filters,
    breakdownType,
    timeSeriesFilter,
}: CreateSavedChartParams): Promise<SavedChart> {
    const savedCharts = await SavedChartModel.find({ workspace: workspace.id })
        .sort({ order: -1 })
        .exec();

    const slugs = new Set(savedCharts.map(savedChart => savedChart.slug));
    let slug = generateNanoId(SAVED_CHART_SLUG_LENGTH);
    while (slugs.has(slug)) {
        slug = generateNanoId(SAVED_CHART_SLUG_LENGTH);
    }

    const order = generateKeyBetween(savedCharts[0]?.order ?? null, null);

    const savedChart = new SavedChartModel({
        workspace: workspace.id,
        createdBy: userId,
        slug,
        name,
        description,
        order,
        analysisType,
        analysisSubject,
        customProperty,
        filters,
        breakdownType,
        timeSeriesFilter,
    });

    const savedChartDoc = await savedChart.save();

    return SavedChart.fromDoc(savedChartDoc);
}

export async function getSavedChartsOf(workspace: Workspace): Promise<SavedChart[]> {

    const savedChartDocs = await SavedChartModel.find({ workspace: workspace.id })
        .sort({ order: 1 })
        .exec();

    const availableSavedChartDocs = savedChartDocs;

    return availableSavedChartDocs.map(savedChartDoc => SavedChart.fromDoc(savedChartDoc));
}

export async function getSavedChart(workspace: Workspace, savedChartSlug: string): Promise<SavedChart> {

    const savedChartDoc = await SavedChartModel.findOne({ workspace: workspace.id, slug: savedChartSlug });

    if (!savedChartDoc) {
        throw new SavedChartNotFound({ workspace: workspace.id, savedChart: savedChartSlug });
    }

    return SavedChart.fromDoc(savedChartDoc);
}

export interface UpdateSavedChartParams {
    name?: string;
    description?: string;
    analysisType?: AnalysisType;
    analysisSubject?: AnalysisSubject;
    customProperty?: string;
    filters?: Filter[];
    breakdownType?: BreakdownType | null;
    timeSeriesFilter?: TimeSeriesFilter;
}

export async function updateSavedChart(workspace: Workspace, savedChartSlug: string, {
    name,
    description,
    analysisType,
    analysisSubject,
    customProperty,
    filters,
    breakdownType,
    timeSeriesFilter,
}: UpdateSavedChartParams): Promise<void> {
    const savedChartDoc = await SavedChartModel.findOne({ workspace: workspace.id, slug: savedChartSlug });

    if (!savedChartDoc) {
        throw new SavedChartNotFound({ workspace: workspace.id, savedChart: savedChartSlug });
    }

    const updates: UpdateQuery<SavedChart> = {};

    if (name !== undefined) {
        updates.$set ??= {};
        updates.$set.name = name;
    }

    if (description !== undefined) {
        updates.$set ??= {};
        updates.$set.description = description;
    }

    if (analysisType !== undefined) {
        updates.$set ??= {};
        updates.$set.analysisType = analysisType;

        if (analysisType === AnalysisType.DataOverTime) {
            updates.$unset ??= {};
            updates.$unset.breakdownType = 1;
        }
    }

    if (analysisSubject !== undefined) {
        if (analysisSubject === AnalysisSubject.CustomProperties) {
            updates.$set ??= {};
            updates.$set.customProperty = customProperty;
        } else {
            updates.$unset ??= {};
            updates.$unset.customProperty = 1;
        }

        updates.$set ??= {};
        updates.$set.analysisSubject = analysisSubject;
    }

    if (filters !== undefined) {
        updates.$set ??= {};
        updates.$set.filters = filters;
    }

    if (breakdownType === null) {
        updates.$unset ??= {};
        updates.$unset.breakdownType = 1;
    } else if (breakdownType !== undefined) {
        updates.$set ??= {};
        updates.$set.breakdownType = breakdownType;
    }

    if (timeSeriesFilter !== undefined) {
        updates.$set ??= {};
        updates.$set.timeSeriesFilter = timeSeriesFilter;
    }

    await SavedChartModel.updateOne({ workspace: workspace.id, slug: savedChartSlug }, updates).exec();
}

export async function deleteSavedChart(workspace: Workspace, savedChartSlug: string): Promise<void> {
    const savedChartDoc = await SavedChartModel.findOne({ workspace: workspace.id, slug: savedChartSlug });

    if (!savedChartDoc) {
        return;
    }

    await SavedChartModel.softDelete(savedChartDoc._id);
}

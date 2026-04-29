import { AnalysisType, getAnalysisTypeParam } from "../../common/models/AnalysisType";
import { type Filter, intoDataAnalysisFilter } from "../../common/models/Filter";
import { timeWindowOptionIntoApiDateFilter } from "../../common/models/TimeWindowOption";
import { config } from "../../config/frontend";
import { type GetDataAnalysisParams } from "../models/GetDataAnalysisParams";

const base = "/api";

export function buildGetDataAnalysisURL({
    workspace,
    analysisType,
    analysisSubject,
    customProperty,
    filters,
    timeSeriesFilter,
    breakdownType,
}: GetDataAnalysisParams) {
    const typeParam = getAnalysisTypeParam(analysisType);
    const url = new URL(`${base}/workspaces/${workspace.slug}/${typeParam}`, config.APP_BASE_URL);

    url.searchParams.set("analysisSubject", analysisSubject);

    if (customProperty) {
        url.searchParams.set("customProperty", customProperty);
    }

    const analysisFilters = intoDataAnalysisFilter(filters);
    if (analysisFilters) {
        url.searchParams.set("filters", JSON.stringify(analysisFilters));
    }

    if (analysisType === AnalysisType.DataOverTime && timeSeriesFilter) {
        url.searchParams.set("timeSeriesFilter", JSON.stringify({
            frequency: timeSeriesFilter.frequency,
            timeWindow: timeWindowOptionIntoApiDateFilter(timeSeriesFilter.timeWindow),
        }));
    }

    if (breakdownType) {
        url.searchParams.set("breakdownType", breakdownType);
    }

    return url.toString();
}

interface DataAnalysisKeyParams extends GetDataAnalysisParams {
    nonCoreFilters?: Partial<Filter>[];
}

export function getDataAnalysisKey({
    workspace,
    analysisType,
    analysisSubject,
    customProperty,
    filters,
    nonCoreFilters,
    timeSeriesFilter,
    breakdownType,
}: DataAnalysisKeyParams) {
    let key = `omlet:${workspace.slug}:${analysisType}:${analysisSubject}`;

    if (customProperty) {
        key += `:${customProperty}`;
    }

    if (filters) {
        key += `:${JSON.stringify(filters)}`;
    }

    if (nonCoreFilters) {
        key += `:${JSON.stringify(nonCoreFilters)}`;
    }

    if (timeSeriesFilter) {
        key += `:${JSON.stringify(timeSeriesFilter)}`;
    }

    if (breakdownType) {
        key += `:${breakdownType}`;
    }

    return key;
}

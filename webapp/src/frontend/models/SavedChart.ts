import slugify from "slugify";

import { type AnalysisSubject } from "../../common/models/AnalysisSubject";
import { type AnalysisType } from "../../common/models/AnalysisType";
import { type BreakdownType } from "../../common/models/BreakdownType";
import { type Filter } from "../../common/models/Filter";
import { type TimeSeriesFilter } from "../../common/models/TimeSeriesFilter";

export const SAVED_CHART_NAME_MAX_LENGTH = 72;
export const SAVED_CHART_DESCRIPTION_MAX_LENGTH = 72;

export interface SavedChart {
    id: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string;
    order: string;
    analysisType: AnalysisType;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    filters: Filter[];
    timeSeriesFilter?: TimeSeriesFilter;
    breakdownType?: BreakdownType;
}

export function getHumanReadableSlug(name: string, slug: string): string {
    return `${slugify(name.replace(/\s+/, " "))}--${slug}`;
}

export function getNameForCopy(name: string): string {
    let originalName = name;
    const suffix = " copy";
    let num = "";

    const match = name.match(/^(.+)(?: copy)(?: (\d+))?$/);
    if (match) {
        const [, matchedName, matchedNum] = match;
        originalName = matchedName;

        const currentNum = matchedNum ? Number.parseInt(matchedNum, 10) : 1;
        num = ` ${currentNum + 1}`;
    }

    return originalName.substring(0, SAVED_CHART_NAME_MAX_LENGTH - suffix.length - num.length) + suffix + num;
}

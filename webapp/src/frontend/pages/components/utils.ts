import LZString from "lz-string";

import { type Filter } from "../../../common/models/Filter";
import { type GetLatestAnalysisComponentsParams } from "../../models/GetLatestAnalysisComponentsParams";
import { SortOrder } from "../../models/SortOrder";
import { SortType } from "../../models/SortType";

export const TAG_KEY = "tag";
export const SEARCH_TERM_KEY = "q";
export const FILTERS_KEY = "filters";
export const FOLDERS_KEY = "folders";
export const SORT_TYPE_KEY = "sortBy";
export const SORT_ORDER_KEY = "sortOrder";

export const API_PARAM_LIMIT = "limit";
export const API_PARAM_SORT_KEY = "sort_key";
export const API_PARAM_SORT_ASCENDING = "sort_ascending";
export const API_PARAM_SEARCH_TERM = "search_term";

export function apiParamsToURLParams(params: GetLatestAnalysisComponentsParams, filters?: Filter[]): URLSearchParams {
    const urlParams = new URLSearchParams();

    if (API_PARAM_SORT_KEY in params) {
        const sortType = params[API_PARAM_SORT_KEY];
        if (sortType !== SortType.Usage) {
            urlParams.set(SORT_TYPE_KEY, sortType);
        }
    }

    if (API_PARAM_SORT_ASCENDING in params) {
        const sortOrder = params[API_PARAM_SORT_ASCENDING] === "true" ? SortOrder.Ascending : SortOrder.Descending;

        if (sortOrder === SortOrder.Ascending) {
            urlParams.set(SORT_ORDER_KEY, sortOrder);
        }
    }

    if (filters) {
        urlParams.set("filters", LZString.compressToEncodedURIComponent(JSON.stringify(filters)));
    }

    return urlParams;
}

import { type SortType } from "./SortType";

export interface GetLatestAnalysisComponentsParams {
    limit: number;
    sort_key: SortType;
    sort_ascending: string;
    next?: number;
    search_term?: string;
}

import { type Analysis } from "./Analysis";
import { type PaginatedResponse } from "./PaginatedResponse";

export interface AnalysesResponse extends PaginatedResponse {
    analyses: Analysis[];
}

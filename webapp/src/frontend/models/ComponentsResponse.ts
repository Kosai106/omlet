import { type Component } from "./Component";
import { type PaginatedResponse } from "./PaginatedResponse";

export interface ComponentsResponse extends PaginatedResponse {
    components: Component[];
}

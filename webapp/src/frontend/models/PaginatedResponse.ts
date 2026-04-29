export interface PaginatedResponse {
    hasPrev: boolean;
    prev?: string;
    hasNext: boolean;
    next?: string;
    total: number;
}

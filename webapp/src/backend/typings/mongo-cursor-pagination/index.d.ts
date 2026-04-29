// import mongoose from "mongoose";

declare module "mongo-cursor-pagination" {
    export type PaginationResult<T> = {
        results: T[];
        next: string;
        hasNext: boolean;
        hasPrev: boolean;
        prev: string;
    };

    export type PaginationParams<T> = {
        // eslint-disable-next-line @typescript-eslint/consistent-type-imports
        query: import("mongoose").FilterQuery<T>;
        paginatedField: string;
        sortAscending?: boolean;
        limit: number;
        next?: string;
        prev?: string;
    };

    const plugin: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mongoosePlugin: (schema: any, options: any) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        find: (collection: any, params: any) => Response;
    };

    // eslint-disable-next-line import/no-default-export
    export default plugin;
}

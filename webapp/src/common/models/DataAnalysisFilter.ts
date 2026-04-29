import { type APIDateFilter } from "./APIDateFilter";
import { type APIEqualityFilter } from "./APIEqualityFilter";
import { type APINumberFilter } from "./APINumberFilter";
import { type APIStringFilter } from "./APIStringFilter";
import { type MetadataFilter } from "./MetadataFilter";

export interface DataAnalysisFilter {
    name?: (APIStringFilter | APIEqualityFilter)[];
    path?: APIStringFilter[];
    tag?: APIEqualityFilter[];
    sourceProject?: APIEqualityFilter[];
    clientProject?: APIEqualityFilter[];
    numOfUsages?: APINumberFilter[];
    numOfDependencies?: APINumberFilter[];
    createdAt?: APIDateFilter[];
    updatedAt?: APIDateFilter[];
    lastUsageChangedAt?: APIDateFilter[];
    metadata?: MetadataFilter[];
}

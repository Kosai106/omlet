import { type AnalysisMetadata } from "./AnalysisMetadata";
import { type Component } from "./Component";
import { type Export } from "./Export";
import { type InvalidDependency } from "./InvalidDependency";
import { type Repository } from "./Repository";

export interface AnalysisResult {
    components: Component[];
    exports: Export[];
    meta: AnalysisMetadata;
    repository?: Repository;
    invalid_dependencies?: InvalidDependency[];
}

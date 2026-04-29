import { type Repository } from "./Repository";

export interface Project {
    name: string;
    alias?: string;
    slug: string;
    packageName: string;
    isInternal: boolean;
    repository?: Repository;
}

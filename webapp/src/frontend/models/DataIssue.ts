import { type Project } from "../../common/models/Project";

import { type AliasIssue } from "./AliasIssue";

export type DataIssue = {
    project: Project;
    isMonorepo: boolean;
    aliasIssues: AliasIssue[];
    exportIssues: string[];
};

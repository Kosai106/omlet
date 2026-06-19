import { type Project } from "../../common/models/Project";
import { type Tag } from "../../common/models/Tag";

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    createdBy: string;
    projects: Project[];
    tags: Tag[];
    htmlElementMap: Record<string, string>;
    numOfMembers: number;
    numOfComponents: number;
    numOfAnalyses: number;
    analysisInProgress: boolean;
}

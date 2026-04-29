import { type User } from "./User";

export interface Analysis {
    id: string;
    packageNames: string[];
    workspaceId: string;
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
    numOfComponents: number;
    cliVersion: string;
    componentCounts: {
        total: number;
        added: number;
        updated: number;
        deleted: number;
    };
}

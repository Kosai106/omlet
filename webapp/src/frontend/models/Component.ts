export interface Component {
    id: string;
    definitionId: string;
    name: string;
    packageName: string;
    createdAt?: Date;
    lastUsageChangedAt: Date;
    updatedAt?: Date;
    numOfDependencies: number;
    numOfUsages: number;
    path: string;
    tags: string[];
    metadata?: Record<string, string | number | boolean | Date>;
}

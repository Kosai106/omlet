export enum FilterType {
    ProjectDefined = "projectDefined",
    ProjectUsedIn = "projectUsedIn",
    Tag = "tag",
    Name = "name",
    FilePath = "filePath",
    CreatedDate = "createdDate",
    LastUpdatedDate = "lastUpdatedDate",
    LastUsageChangedDate = "lastUsageChangedDate",
    NumberOfUsages = "numberOfUsages",
    NumberOfDependencies = "numberOfDependencies",
    CustomProperty = "customProperty",
}

export type RegularFilterType = Exclude<FilterType, FilterType.CustomProperty>;
export type ArrayFilterType = FilterType.ProjectDefined | FilterType.ProjectUsedIn | FilterType.Tag;
export type StringFilterType = FilterType.Name | FilterType.FilePath;
export type DateFilterType = FilterType.CreatedDate | FilterType.LastUpdatedDate | FilterType.LastUsageChangedDate;
export type NumberFilterType = FilterType.NumberOfUsages | FilterType.NumberOfDependencies;

export function getFilterTypeLabel(filterType: FilterType): string {
    switch (filterType) {
        case FilterType.ProjectDefined:
            return "Project it's from";
        case FilterType.ProjectUsedIn:
            return "Project it's used in";
        case FilterType.Tag:
            return "Tag";
        case FilterType.Name:
            return "Name";
        case FilterType.FilePath:
            return "File path";
        case FilterType.CreatedDate:
            return "Created date";
        case FilterType.LastUpdatedDate:
            return "Last updated date";
        case FilterType.LastUsageChangedDate:
            return "Last usage change date";
        case FilterType.NumberOfUsages:
            return "Number of usages";
        case FilterType.NumberOfDependencies:
            return "Number of dependencies";
        case FilterType.CustomProperty:
            return "Custom property";
    }
}

export function fieldIntoFilterType(field: string): FilterType {
    switch (field) {
        case "component.packageName":
            return FilterType.ProjectDefined;
        case "usingComponents.packageName":
            return FilterType.ProjectUsedIn;
        case "component.tags":
            return FilterType.Tag;
        case "component.name":
            return FilterType.Name;
        case "component.path":
            return FilterType.FilePath;
        case "component.createdAt":
            return FilterType.CreatedDate;
        case "component.updatedAt":
            return FilterType.LastUpdatedDate;
        case "lastUsageChangedAt":
            return FilterType.LastUsageChangedDate;
        case "usingComponents.length":
            return FilterType.NumberOfUsages;
        case "component.numOfDependencies":
            return FilterType.NumberOfDependencies;
        default: {
            if (field.includes("metadata")) {
                return FilterType.CustomProperty;
            }

            throw "Unkown field";
        }
    }
}

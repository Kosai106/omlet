import { AnalysisSubject } from "./AnalysisSubject";

export enum BreakdownType {
    ProjectDefined = "projectDefined",
    ProjectUsedIn = "projectUsedIn",
    Tag = "tag",
}

export function getValidBreakdownTypes(analysisSubject?: AnalysisSubject): BreakdownType[] {
    switch (analysisSubject) {
        case AnalysisSubject.Components:
            return [BreakdownType.ProjectUsedIn];
        case AnalysisSubject.Projects:
            return [BreakdownType.ProjectDefined, BreakdownType.Tag];
        case AnalysisSubject.Tags:
            return [BreakdownType.ProjectDefined, BreakdownType.ProjectUsedIn];
        case AnalysisSubject.CustomProperties:
            return [BreakdownType.ProjectDefined, BreakdownType.ProjectUsedIn, BreakdownType.Tag];
        default:
            return [];
    }
}

export function toBreakdownType(breakdown: string | null | undefined, subject?: AnalysisSubject): BreakdownType | undefined {
    if (!breakdown || !subject) {
        return undefined;
    }

    const validBreakdownTypes = getValidBreakdownTypes(subject);
    if (!validBreakdownTypes.includes(breakdown as BreakdownType)) {
        return undefined;
    }

    return breakdown as BreakdownType;
}

export function getBreakdownTypeLabel(breakdownType: BreakdownType): string {
    switch (breakdownType) {
        case BreakdownType.ProjectDefined:
            return "Project it's from";
        case BreakdownType.ProjectUsedIn:
            return "Project it's used in";
        case BreakdownType.Tag:
            return "Tag";
    }
}

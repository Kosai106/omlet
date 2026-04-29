export enum AnalysisSubject {
    Components = "components",
    Projects = "projects",
    Tags = "tags",
    CustomProperties = "customProperties",
}

export function toAnalysisSubject(subject: string | null | undefined): AnalysisSubject | undefined {
    const validAnalysisSubjects: string[] = Object.values(AnalysisSubject);

    if (!subject || !validAnalysisSubjects.includes(subject)) {
        return undefined;
    }

    return subject as AnalysisSubject;
}

export function getAnalysisSubjectLabel(type: AnalysisSubject): string {
    switch (type) {
        case AnalysisSubject.Components:
            return "Components";
        case AnalysisSubject.Projects:
            return "Projects";
        case AnalysisSubject.Tags:
            return "Tags";
        case AnalysisSubject.CustomProperties:
            return "Custom properties";
    }
}

export function getAnalysisSubjectTooltipText(type: AnalysisSubject): string {
    switch (type) {
        case AnalysisSubject.Components:
            return "Compare usages of individual components — e.g. Button vs. Icon";
        case AnalysisSubject.Projects:
            return "Compare component usages in different packages — e.g. @acme/profile vs. @acme/payment";
        case AnalysisSubject.Tags:
            return "Compare usages of collections of components that are tagged — e.g. library vs. legacy library, v1 vs. v2";
        case AnalysisSubject.CustomProperties:
            return "Assign custom properties to your components using Omlet’s CLI hooks. Use them to filter, tag and analyze components.";
    }
}

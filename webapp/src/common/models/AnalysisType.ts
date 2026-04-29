export enum AnalysisType {
    LatestData = "latest",
    DataOverTime = "over-time",
}

export function toAnalysisType(type: string | null | undefined): AnalysisType {
    if (!type || !Object.values<string>(AnalysisType).includes(type)) {
        return AnalysisType.LatestData;
    }

    return type as AnalysisType;
}

export function getAnalysisTypeParam(type: AnalysisType) {
    switch (type) {
        case AnalysisType.LatestData:
            return "latest-data-analyses";
        case AnalysisType.DataOverTime:
            return "timeseries-analyses";
    }
}

export function getAnalysisTypeLabel(type: AnalysisType) {
    switch (type) {
        case AnalysisType.LatestData:
            return "Current";
        case AnalysisType.DataOverTime:
            return "Over time";
    }
}

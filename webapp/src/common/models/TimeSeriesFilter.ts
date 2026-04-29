import LZString from "lz-string";

import { DataFrequencyOption, dataFrequencyDayGaps } from "./DataFrequencyOption";
import { TimeWindowOption, availableFrequencyOptionsForTimeWindows } from "./TimeWindowOption";

export interface TimeSeriesFilter {
    timeWindow: TimeWindowOption;
    frequency: DataFrequencyOption;
}

export function getDataFrequencyDayGapForGraph({ timeWindow, frequency }: TimeSeriesFilter) {
    if (timeWindow === TimeWindowOption.Last4Weeks && frequency === DataFrequencyOption.Daily) {
        return dataFrequencyDayGaps[DataFrequencyOption.Weekly];
    }

    if (timeWindow === TimeWindowOption.Last6Months && frequency === DataFrequencyOption.Weekly) {
        return dataFrequencyDayGaps[DataFrequencyOption.Monthly];
    }

    return dataFrequencyDayGaps[frequency];
}

export function hasSameTimeSeriesFilters(filter1?: TimeSeriesFilter, filter2?: TimeSeriesFilter): boolean {
    return filter1?.frequency === filter2?.frequency &&
        filter1?.timeWindow === filter2?.timeWindow;
}

export function toTimeSeriesFilter(timeSeriesFilter: string | null | undefined): TimeSeriesFilter | undefined {
    if (timeSeriesFilter) {
        return JSON.parse(LZString.decompressFromEncodedURIComponent(timeSeriesFilter)) as TimeSeriesFilter;
    }

    return undefined;
}

export const DEFAULT_TIME_SERIES_FILTER: TimeSeriesFilter = {
    timeWindow: TimeWindowOption.Last4Weeks,
    frequency: DataFrequencyOption.Weekly,
};

export function getNextAvailableFilter(currentFilter: TimeSeriesFilter): TimeSeriesFilter {
    if (currentFilter.timeWindow === TimeWindowOption.AllScans) {
        return currentFilter;
    }

    const windowOptions = Object.keys(availableFrequencyOptionsForTimeWindows);
    const currentFilterIndex = windowOptions.findIndex(option => option === currentFilter.timeWindow);
    const nextTimeWindow = windowOptions[currentFilterIndex + 1] as TimeWindowOption;
    return {
        timeWindow: nextTimeWindow,
        frequency: availableFrequencyOptionsForTimeWindows[nextTimeWindow][0],
    };
}

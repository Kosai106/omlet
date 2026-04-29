import { type APIDateFilter } from "./APIDateFilter";
import { DataFrequencyOption } from "./DataFrequencyOption";
import { FilterOperation } from "./FilterOperation";

export enum TimeWindowOption {
    Last7Days = "last7Days",
    Last2Weeks = "last2Weeks",
    Last4Weeks = "last4Weeks",
    Last3Months = "last3Months",
    Last6Months = "last6Months",
    Last12Months = "last12Months",
    AllScans = "allScans",
}

export const availableFrequencyOptionsForTimeWindows: Record<TimeWindowOption, DataFrequencyOption[]> = Object.freeze({
    [TimeWindowOption.Last7Days]: [DataFrequencyOption.Daily],
    [TimeWindowOption.Last2Weeks]: [DataFrequencyOption.Daily, DataFrequencyOption.Weekly],
    [TimeWindowOption.Last4Weeks]: [DataFrequencyOption.Daily, DataFrequencyOption.Weekly],
    [TimeWindowOption.Last3Months]: [DataFrequencyOption.Weekly, DataFrequencyOption.Monthly],
    [TimeWindowOption.Last6Months]: [DataFrequencyOption.Weekly, DataFrequencyOption.Monthly],
    [TimeWindowOption.Last12Months]: [DataFrequencyOption.Monthly],
    [TimeWindowOption.AllScans]: [DataFrequencyOption.Monthly],
});

export function getTimeWindowOptionLabel(dateOption: TimeWindowOption): string {
    switch (dateOption) {
        case TimeWindowOption.Last7Days:
            return "Last 7 Days";
        case TimeWindowOption.Last2Weeks:
            return "Last 2 Weeks";
        case TimeWindowOption.Last4Weeks:
            return "Last 4 Weeks";
        case TimeWindowOption.Last3Months:
            return "Last 3 Months";
        case TimeWindowOption.Last6Months:
            return "Last 6 Months";
        case TimeWindowOption.Last12Months:
            return "Last 12 Months";
        case TimeWindowOption.AllScans:
            return "All Scans";
    }
}

export function timeWindowOptionIntoDate(dateOption: TimeWindowOption): Date | undefined {
    const result = new Date();
    switch (dateOption) {
        case TimeWindowOption.Last7Days:
            result.setDate(result.getDate() - 7);
            break;
        case TimeWindowOption.Last2Weeks:
            result.setDate(result.getDate() - 14);
            break;
        case TimeWindowOption.Last4Weeks:
            result.setDate(result.getDate() - 28);
            break;
        case TimeWindowOption.Last3Months:
            result.setMonth(result.getMonth() - 3);
            break;
        case TimeWindowOption.Last6Months:
            result.setMonth(result.getMonth() - 6);
            break;
        case TimeWindowOption.Last12Months:
            result.setMonth(result.getMonth() - 12);
            break;
        case TimeWindowOption.AllScans:
            return undefined;
    }
    return result;
}

export function timeWindowOptionIntoApiDateFilter(timeWindowOption: TimeWindowOption): APIDateFilter {
    return {
        operation: FilterOperation.Between,
        value: [timeWindowOptionIntoDate(timeWindowOption), new Date()],
    };
}

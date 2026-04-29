export enum DateOption {
    Today = "today",
    Yesterday = "yesterday",
    OneWeekAgo = "oneWeekAgo",
    TwoWeeksAgo = "twoWeeksAgo",
    OneMonthAgo = "oneMonthAgo",
    ThreeMonthsAgo = "threeMonthsAgo",
}

export function getDateOptionLabel(dateOption: DateOption): string {
    switch (dateOption) {
        case DateOption.Today:
            return "Today";
        case DateOption.Yesterday:
            return "Yesterday";
        case DateOption.OneWeekAgo:
            return "1 week ago";
        case DateOption.TwoWeeksAgo:
            return "2 weeks ago";
        case DateOption.OneMonthAgo:
            return "1 month ago";
        case DateOption.ThreeMonthsAgo:
            return "3 months ago";
    }
}

export function dateOptionIntoDate(dateOption: DateOption): Date {
    const result = new Date();
    switch (dateOption) {
        case DateOption.Today:
            break;
        case DateOption.Yesterday:
            result.setDate(result.getDate() - 1);
            break;
        case DateOption.OneWeekAgo:
            result.setDate(result.getDate() - 7);
            break;
        case DateOption.TwoWeeksAgo:
            result.setDate(result.getDate() - 14);
            break;
        case DateOption.OneMonthAgo:
            result.setMonth(result.getMonth() - 1);
            break;
        case DateOption.ThreeMonthsAgo:
            result.setMonth(result.getMonth() - 3);
            break;
    }
    return result;
}

export function isDateOption(optionValue?: string): optionValue is DateOption {
    return optionValue !== undefined && Object.values<string>(DateOption).includes(optionValue);
}

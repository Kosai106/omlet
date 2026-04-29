export enum DataFrequencyOption {
    Daily = "daily",
    Weekly = "weekly",
    Monthly = "monthly",
}

export const dataFrequencyDayGaps: Record<DataFrequencyOption, number> = Object.freeze({
    [DataFrequencyOption.Daily]: 1,
    [DataFrequencyOption.Weekly]: 7,
    [DataFrequencyOption.Monthly]: 30,
});

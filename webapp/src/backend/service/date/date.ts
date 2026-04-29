export const SECOND_IN_MILLISECONDS = 1000;
export const DAY_IN_SECONDS = 86400;
export const DAY_IN_MILLISECONDS = DAY_IN_SECONDS * SECOND_IN_MILLISECONDS;
export const WEEK_IN_DAYS = 7;
export const WEEK_IN_SECONDS = WEEK_IN_DAYS * DAY_IN_SECONDS;
export const WEEK_IN_MILLISECONDS = WEEK_IN_SECONDS * SECOND_IN_MILLISECONDS;

export function timestampToDate(timestamp: number): Date {
    return new Date(timestamp * SECOND_IN_MILLISECONDS);
}

export function dateToTimestamp(date: Date): number {
    return Math.floor(date.getTime() / SECOND_IN_MILLISECONDS);
}

export function addDays(date: Date, numberOfDays: number): Date {
    const result = new Date(date);
    result.setTime(result.getTime() + (numberOfDays * DAY_IN_MILLISECONDS));
    return result;
}

export function subtractDays(date: Date, numberOfDays: number): Date {
    return addDays(date, -numberOfDays);
}

export function toISODateString(date: Date): string {
    return date.toISOString().substring(0, 10);
}

// weekDay is 0 for Monday, 1 for Tuesday, ..., 6 for Sunday.
export function setUTCWeekDay(date: Date, weekDay: number): number {
    return date.setUTCDate(date.getUTCDate() + weekDay - (date.getUTCDay() + 6) % 7);
}

// Returns the ISO week date of the given date.
// The ISO week date is in the format "YYYY-Www" (e.g. "2020-W12").
// Sources: https://en.wikipedia.org/wiki/ISO_week_date
//          https://weeknumber.com/how-to/javascript
export function toISOWeekString(date: Date): string {
    // In week-year numbering, first week is called as week 01
    // and it is the week that contains the first Thursday of the year.
    // This means we need to find the Thursday in the week that contains the given date.
    const week = new Date(date.getTime());
    week.setUTCHours(0, 0, 0, 0);
    setUTCWeekDay(week, 3);

    // January 4 is always in week 01.
    // Find the thursday in week 01 by setting the date to January 4 and adjusting to Thursday.
    const firstWeek = new Date(`${week.getUTCFullYear()}-01-04T00:00:00Z`);
    setUTCWeekDay(firstWeek, 3);

    // Calculate the number of the week from the difference between week 01 and current week.
    const weekNumber = 1 + (week.getTime() - firstWeek.getTime()) / WEEK_IN_MILLISECONDS;

    return `${week.getUTCFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

export function toISOMonthString(date: Date): string {
    return date.toISOString().substring(0, 7);
}

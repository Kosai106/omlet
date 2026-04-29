import { setUTCWeekDay, toISOWeekString } from "./date";


describe("Date Service", () => {
    describe("setUTCWeekDay", () => {
        it("should set the correct week when the new week day is bigger than the current week day", () => {
            const date = new Date("2020-01-01T00:00:00Z");
            const weekDay = 4;
            const expected = new Date("2020-01-03T00:00:00Z");
            expect(setUTCWeekDay(date, weekDay)).toBe(expected.getTime());
            expect(date.toISOString()).toBe(expected.toISOString());
        });

        it("should set the correct week when the new week day is smaller than the current week day", () => {
            const date = new Date("2020-01-01T00:00:00Z");
            const weekDay = 0;
            const expected = new Date("2019-12-30T00:00:00Z");
            expect(setUTCWeekDay(date, weekDay)).toBe(expected.getTime());
            expect(date.toISOString()).toBe(expected.toISOString());
        });

        it("should set the correct week when the new week day is the same as the current week day", () => {
            const date = new Date("2020-01-01T00:00:00Z");
            const weekDay = 2;
            const expected = new Date("2020-01-01T00:00:00Z");
            expect(setUTCWeekDay(date, weekDay)).toBe(expected.getTime());
            expect(date.toISOString()).toBe(expected.toISOString());
        });
    });

    describe("toISOWeekString", () => {
        it.each([
            // Test cases from https://en.wikipedia.org/wiki/ISO_week_date
            // start of the day
            [new Date("1977-01-01T00:00:00Z"), "1976-W53"],
            [new Date("1977-01-02T00:00:00Z"), "1976-W53"],
            [new Date("1977-12-31T00:00:00Z"), "1977-W52"],
            [new Date("1978-01-01T00:00:00Z"), "1977-W52"],
            [new Date("1978-01-02T00:00:00Z"), "1978-W01"],
            [new Date("1978-12-31T00:00:00Z"), "1978-W52"],
            [new Date("1979-01-01T00:00:00Z"), "1979-W01"],
            [new Date("1979-12-30T00:00:00Z"), "1979-W52"],
            [new Date("1979-12-31T00:00:00Z"), "1980-W01"],
            [new Date("1980-01-01T00:00:00Z"), "1980-W01"],
            [new Date("1980-12-28T00:00:00Z"), "1980-W52"],
            [new Date("1980-12-29T00:00:00Z"), "1981-W01"],
            [new Date("1980-12-30T00:00:00Z"), "1981-W01"],
            [new Date("1980-12-31T00:00:00Z"), "1981-W01"],
            [new Date("1981-01-01T00:00:00Z"), "1981-W01"],
            [new Date("1981-12-31T00:00:00Z"), "1981-W53"],
            [new Date("1982-01-01T00:00:00Z"), "1981-W53"],
            [new Date("1982-01-02T00:00:00Z"), "1981-W53"],
            [new Date("1982-01-03T00:00:00Z"), "1981-W53"],

            // end of the day
            [new Date("1977-01-01T23:59:59Z"), "1976-W53"],
            [new Date("1977-01-02T23:59:59Z"), "1976-W53"],
            [new Date("1977-12-31T23:59:59Z"), "1977-W52"],
            [new Date("1978-01-01T23:59:59Z"), "1977-W52"],
            [new Date("1978-01-02T23:59:59Z"), "1978-W01"],
            [new Date("1978-12-31T23:59:59Z"), "1978-W52"],
            [new Date("1979-01-01T23:59:59Z"), "1979-W01"],
            [new Date("1979-12-30T23:59:59Z"), "1979-W52"],
            [new Date("1979-12-31T23:59:59Z"), "1980-W01"],
            [new Date("1980-01-01T23:59:59Z"), "1980-W01"],
            [new Date("1980-12-28T23:59:59Z"), "1980-W52"],
            [new Date("1980-12-29T23:59:59Z"), "1981-W01"],
            [new Date("1980-12-30T23:59:59Z"), "1981-W01"],
            [new Date("1980-12-31T23:59:59Z"), "1981-W01"],
            [new Date("1981-01-01T23:59:59Z"), "1981-W01"],
            [new Date("1981-12-31T23:59:59Z"), "1981-W53"],
            [new Date("1982-01-01T23:59:59Z"), "1981-W53"],
            [new Date("1982-01-02T23:59:59Z"), "1981-W53"],
            [new Date("1982-01-03T23:59:59Z"), "1981-W53"],
        ])("should return the correct ISO week string for %s", (date, expected) => {
            expect(toISOWeekString(date)).toBe(expected);
        });

        it("should return the correct ISO week based on UTC time", () => {
            expect(toISOWeekString(new Date("1979-01-01T00:00:00+02:00"))).toBe("1978-W52");
        });
    });
});

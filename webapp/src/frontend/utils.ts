import { type RefObject } from "react";

import { FilterDataType } from "../common/models/FilterDataType";

import { APIError } from "./api/api";
import { Browser } from "./enums";

export function isValidDate(date: string | number | Date): boolean {
    return Number.isFinite(new Date(date).getTime());
}

const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
};

export function formatDate(date: string | number | Date, options: Intl.DateTimeFormatOptions = defaultOptions): string {
    let formatter = new Intl.DateTimeFormat("en", options);
    const { timeZone } = formatter.resolvedOptions();

    if (!timeZone || timeZone.toLowerCase() === "etc/unknown") {
        options.timeZone = "UTC";
        formatter = new Intl.DateTimeFormat("en", options);
    }

    return formatter.format(new Date(date));
}

export function toISODateString(date: string | number | Date): string {
    return new Date(date).toISOString().substring(0, 10);
}

export function formatPercentage(ratio: number): string {
    if (ratio < 0.001) {
        return "< 0.1%";
    } else if (ratio >= 0.995 && ratio < 1) {
        return "99.9%";
    } else {
        return Intl.NumberFormat("en-US", {
            style: "percent",
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).format(ratio);
    }
}

interface ListFormatOptions {
    type?: Intl.ListFormatType;
    limit?: number;
}

export function formatList(list: string[], { type, limit }: ListFormatOptions = {}): string {
    if (limit !== undefined && list.length - 1 > limit) {
        list = list.slice(0, limit).concat(`${list.length - limit} more`);
    }

    return new Intl.ListFormat("en-US", { type: type ?? "conjunction" }).format(list);
}

const EPSILON = 0.001;

export function isAlmostEqual(f1: number, f2: number): boolean {
    return f1 === f2 || Math.abs(f1 - f2) < EPSILON;
}

export function * range(start: number, end: number, step = 1): IterableIterator<number> {
    for (let i = start; i <= end; i += step) {
        yield i;
    }
}

interface FileData {
    data: string;
    name: string;
}

export function triggerDownload(file: FileData) {
    const anchor = document.createElement("a");
    anchor.href = file.data;
    anchor.download = file.name;
    anchor.style.display = "none";

    document.body.appendChild(anchor);

    anchor.addEventListener("click", ev => {
        ev.stopPropagation();

        setTimeout(() => {
            URL.revokeObjectURL(file.data);
        }, 1500);

        anchor.remove();
    });

    anchor.click();
}

export function* arrayChunk<T>(array: T[], chunkSize: number): Generator<T[]> {
    for (let i = 0; i < array.length; i += chunkSize) {
        yield array.slice(i, i + chunkSize);
    }
}

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export function hexToRGBA(hex: string): Color {
    let hexBase = hex.replace("#", "");

    if (hexBase.length === 3 || hexBase.length === 4) {
        hexBase = hexBase.replace(/(.)/g, "$1$1");
    }

    const num = Number.parseInt(hexBase, 16);

    let shiftAmount = (hexBase.length / 2 - 1) * 8;

    const r = (num >> shiftAmount) & 255;
    shiftAmount -= 8;

    const g = (num >> shiftAmount) & 255;
    shiftAmount -= 8;

    const b = (num >> shiftAmount) & 255;
    shiftAmount -= 8;

    const a = shiftAmount < 0 ? 1 : ((num >> shiftAmount) & 255) / 255;

    return { r, g, b, a };
}

// actually, threshold value is supposed to be 128
const LIGHTNESS_THRESHOLD = 150;

function getBrightness({ r, g, b }: Color): number {
    return (r * 299 + g * 587 + b * 114) / 1000;
}

export function isDark(color: Color): boolean {
    return getBrightness(color) < LIGHTNESS_THRESHOLD;
}

export function isLight(color: Color): boolean {
    return !isDark(color);
}

function getFirstScrollableParent(element: HTMLElement) {
    if (!element) {
        return null;
    }

    let container = element.parentElement;

    // Find first scrollable container
    while (container && container.scrollHeight <= container.clientHeight) {
        container = container.parentElement;
    }

    return container;
}

export function scrollIntoViewIfNecessary(element: HTMLElement, offset = 0) {
    const container = getFirstScrollableParent(element);

    if (!container) {
        return;
    }

    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    requestAnimationFrame(() => {
        if (elementRect.top < containerRect.top) {
            container.scrollTop -= containerRect.top - elementRect.top + offset;
        } else if (elementRect.bottom > containerRect.bottom) {
            container.scrollTop += elementRect.bottom - containerRect.bottom + offset;
        }
    });
}

export function isToday(date: string | number | Date): boolean {
    const today = new Date();
    const anotherDay = new Date(date);

    return anotherDay.getFullYear() === today.getFullYear() &&
        anotherDay.getMonth() === today.getMonth() &&
        anotherDay.getDate() === today.getDate();
}

export function getBrowser(): Browser {
    if (/Edg/.test(navigator.userAgent)) {
        return Browser.Edge;
    }

    if (/OPR/.test(navigator.userAgent)) {
        return Browser.Opera;
    }

    if (/Firefox/.test(navigator.userAgent)) {
        return Browser.Firefox;
    }

    if (/Chrome/.test(navigator.userAgent)) {
        return Browser.Chrome;
    }

    if (/Safari/.test(navigator.userAgent)) {
        return Browser.Safari;
    }

    return Browser.Unknown;
}

const pr = new Intl.PluralRules("en-US", { type: "ordinal" });
const suffixes = new Map([
    ["one", "st"],
    ["two", "nd"],
    ["few", "rd"],
    ["other", "th"],
]);

export function toOrdinal(n: number): string {
    const rule = pr.select(n);
    const suffix = suffixes.get(rule);
    return `${n}${suffix}`;
}


function letterSpacingIntoNumber(letterSpacing?: string): number | undefined {
    if (!letterSpacing || !letterSpacing.endsWith("px")) {
        return;
    }
    const result = Number.parseFloat(letterSpacing?.substr(0, letterSpacing.length - 2));

    return Number.isFinite(result) ? result : undefined;

}

interface CanvasRenderingContext2DWithLetterSpacing extends CanvasRenderingContext2D {
    letterSpacing?: string;
}

export function generateGetTextWidth(fontSize = "13px", fontFamily = "Inter", letterSpacing = `0.${fontSize}`) {
    const ctx = document.createElement("canvas").getContext("2d")! as CanvasRenderingContext2DWithLetterSpacing;
    // CanvasRenderingContext2D.letterSpacing is experimental
    // We need to calculate letter spacing manually on fallback.
    // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/letterSpacing
    if ("letterSpacing" in ctx) {
        ctx.letterSpacing = letterSpacing;
    }
    ctx.font = `${fontSize} ${fontFamily}` ;

    return function (text: string): number {
        if ("letterSpacing" in ctx) {
            return ctx.measureText(text).width;
        }
        return ctx.measureText(text).width + (text.length * (letterSpacingIntoNumber(letterSpacing) ?? 0.13));
    };
}

export function generateGetTextWidthFromRef(ref: RefObject<Element>) {
    const computedStyles = ref.current && window.getComputedStyle(ref.current) ;
    return generateGetTextWidth(computedStyles?.fontSize, computedStyles?.fontFamily, computedStyles?.letterSpacing);
}

export function getDaysBetween(start: Date, end: Date) {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function alertError<T extends Error>(error: T) {
    if (error instanceof APIError) {
        window.alert(`${error.title}\n\n${error.detail}`);
    }
}

export function isValidRegex(regex: string): boolean {
    try {
        new RegExp(regex);
        return true;
    } catch {
        return false;
    }
}

export function getPlainURL(url: string): string {
    return url.split("://")[1];
}

export function getHumanReadableURL(url: string) {
    return url.replace(/^http(s)?:\/\//, "");
}

function isBooleanArray(array: (string | number | boolean | Date)[]): array is boolean[] {
    return array.every(value => typeof value === "boolean");
}

export function isDateArray(array: (string | number | boolean | Date)[]): array is (string | Date)[] {
    return array.every(value =>
        value instanceof Date ||
        (typeof value === "string" && Number.isNaN(Number.parseFloat(value)) && isValidDate(value))
    );
}

function isNumberArray(array: (string | number | boolean | Date)[]): array is number[] {
    return array.every(value => typeof value === "number");
}

export function getCustomPropertyTypes(customProperties: Record<string, (string | number | boolean | Date)[]>): Record<string, FilterDataType> {
    return Object.fromEntries(
        Object.entries(customProperties).map(([key, values]) => {
            let type: FilterDataType;

            if (isBooleanArray(values)) {
                type = FilterDataType.Boolean;
            } else if (isDateArray(values)) {
                type = FilterDataType.Date;
            } else if (isNumberArray(values)) {
                type = FilterDataType.Number;
            } else {
                type = FilterDataType.String;
            }

            return [key, type];
        })
    );
}

export function getRandomInteger(max: number, min = 0) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomItem<T>(array: T[]): T {
    return array[getRandomInteger(array.length - 1)];
}

export function toCSSValue(value: number | string | undefined): string | undefined {
    if (value === undefined) {
        return value;
    }

    if (typeof value === "number") {
        return `${value}px`;
    }

    return value;
}

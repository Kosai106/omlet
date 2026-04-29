export const USER_DEFINED_TAG_COLORS = [
    "var(--tag-color-1)",
    "var(--tag-color-2)",
    "var(--tag-color-3)",
    "var(--tag-color-4)",
    "var(--tag-color-5)",
    "var(--tag-color-6)",
    "var(--tag-color-7)",
    "var(--tag-color-8)",
    "var(--tag-color-9)",
];

export const CHART_COLORS = [
    "var(--chart-color-1)",
    "var(--chart-color-2)",
    "var(--chart-color-3)",
    "var(--chart-color-4)",
    "var(--chart-color-5)",
    "var(--chart-color-6)",
    "var(--chart-color-7)",
    "var(--chart-color-8)",
    "var(--chart-color-9)",
    "var(--chart-color-10)",
    "var(--chart-color-11)",
    "var(--chart-color-12)",
];

export const TAG_TO_CHART_COLOR_MAP: Record<string, string> = {
    "var(--tag-color-core)": "var(--chart-color-1)",
    "var(--tag-color-external)": "var(--chart-color-4)",
    "var(--tag-color-non-core)": "var(--chart-color-2)",
    "var(--tag-color-untagged)": "var(--chart-color-13)",
    "var(--tag-color-1)": "var(--chart-color-3)",
    "var(--tag-color-2)": "var(--chart-color-5)",
    "var(--tag-color-3)": "var(--chart-color-6)",
    "var(--tag-color-4)": "var(--chart-color-7)",
    "var(--tag-color-5)": "var(--chart-color-8)",
    "var(--tag-color-6)": "var(--chart-color-9)",
    "var(--tag-color-7)": "var(--chart-color-10)",
    "var(--tag-color-8)": "var(--chart-color-11)",
    "var(--tag-color-9)": "var(--chart-color-12)",
};

export function getColorMap(colors: string[], usedColors: string[]): Record<string, number> {
    return usedColors.reduce<Record<string, number>>(
        (acc, usedColor) => {
            if (acc[usedColor] !== undefined) {
                acc[usedColor] += 1;
            }
            return acc;
        },
        Object.fromEntries(colors.map(color => [color, 0]))
    );
}

export function getNextColor(colorMap: Record<string, number>): string {
    const [color] = Object.entries(colorMap).reduce((acc, current) => acc[1] > current[1] ? current : acc);
    return color;
}

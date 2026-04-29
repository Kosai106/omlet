interface FormatNounWithNumberOptions {
    pluralSuffix?: string;
    pluralForm?: string;
}

export function pluralize(
    noun: string,
    count: number,
    {
        pluralSuffix = "s",
        pluralForm = `${noun}${pluralSuffix}`,
    }: FormatNounWithNumberOptions = {}
) {
    return `${count} ${count === 1 ? noun : pluralForm}`;
}

export function formatList(list: string[], type = "conjunction"): string {
    const separator = type === "disjunction" ? "or" : "and";

    if (list.length < 3) {
        return list.join(` ${separator} `);
    }

    return `${list.slice(0, -1).join(", ")}, ${separator} ${list[list.length - 1]}`;
}

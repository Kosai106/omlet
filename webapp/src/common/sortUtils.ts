import { type ChartDatum } from "./models/ChartDatum";
import { type Project } from "./models/Project";
import { type Tag, RESERVED_TAGS } from "./models/Tag";

const collator = new Intl.Collator("en", { caseFirst: "upper", numeric: true });

export function compareString(a: string, b: string): number {
    return collator.compare(a, b);
}

type ProjectSummary = Pick<Project, "name" | "isInternal">;
export function compareProject(a: ProjectSummary, b: ProjectSummary): number {
    if (a.isInternal && !b.isInternal) {
        return -1;
    }

    if (!a.isInternal && b.isInternal) {
        return 1;
    }

    if (a.name.startsWith("@") && !b.name.startsWith("@")) {
        return -1;
    }

    if (!a.name.startsWith("@") && b.name.startsWith("@")) {
        return 1;
    }

    return compareString(a.name, b.name);
}

export function compareTag(a?: Tag, b?: Tag) {
    // Tag can be undefined when it's deleted but exists in historical data
    if (a === undefined) {
        return 1;
    }

    if (b === undefined) {
        return -1;
    }

    if (a.slug === RESERVED_TAGS.CORE.slug) {
        return -1;
    }

    if (b.slug === RESERVED_TAGS.CORE.slug) {
        return 1;
    }

    if (a.slug === RESERVED_TAGS.EXTERNAL.slug) {
        return -1;
    }

    if (b.slug === RESERVED_TAGS.EXTERNAL.slug) {
        return 1;
    }

    if (a.slug === RESERVED_TAGS.UNTAGGED.slug) {
        return 1;
    }

    if (b.slug === RESERVED_TAGS.UNTAGGED.slug) {
        return -1;
    }

    return a.createdAt.getTime() - b.createdAt.getTime();
}

export function compareChartDatumTagPercentage(a: ChartDatum, b: ChartDatum) {
    const aCoreValue = a.values.find(({ id }) => id === RESERVED_TAGS.CORE.slug)?.value;
    const aValueSum = a.values.reduce((sum, { value }) => sum + value, 0);

    const bCoreValue = b.values.find(({ id }) => id === RESERVED_TAGS.CORE.slug)?.value;
    const bValueSum = b.values.reduce((sum, { value }) => sum + value, 0);

    if (!aCoreValue && !bCoreValue) {
        return compareString(a.label, b.label);
    }

    if (!aCoreValue) {
        return 1;
    }

    if (!bCoreValue) {
        return -1;
    }

    const aCorePercentage = aCoreValue / aValueSum;
    const bCorePercentage = bCoreValue / bValueSum;

    if (aCorePercentage === bCorePercentage) {
        return compareString(a.label, b.label);
    }

    return bCorePercentage - aCorePercentage;
}

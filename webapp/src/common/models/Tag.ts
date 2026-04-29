import { type PartialExcept } from "../utilityTypes";
import { generateSlug, isCapitalized } from "../utils";

import { type Filter } from "./Filter";
import { type FolderFilter, EMPTY_FOLDER_FILTER } from "./FolderFilter";

export interface Tag extends FolderFilter {
    name: string;
    slug: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    searchTerm: string;
    filters: Filter[];
}

export const RESERVED_TAGS: Record<"CORE" | "EXTERNAL" | "UNTAGGED", Tag & { tooltip: string; }> = Object.freeze({
    CORE: {
        ...createTag({
            slug: "core",
            name: "core",
            color: "var(--tag-color-core)",
        }),
        tooltip: "Design system/library components",
    },
    EXTERNAL: {
        ...createTag({
            slug: "<external>",
            name: "external",
            color: "var(--tag-color-external)",
        }),
        tooltip: "Components from third party libraries",
    },
    UNTAGGED: {
        ...createTag({
            slug: "<untagged>",
            name: "Untagged",
            color: "var(--tag-color-untagged)",
        }),
        tooltip: "Components not tagged",
    },
});

export function hasCoreTag(tags: Tag[]): boolean {
    return tags.some(tag => tag.slug === RESERVED_TAGS.CORE.slug);
}

export function getCoreTag(tags: Tag[]): Tag {
    return tags.find(tag => tag.slug === RESERVED_TAGS.CORE.slug) ?? RESERVED_TAGS.CORE;
}

export const NON_CORE_TAG_SLUG = "<non-core>";

export function getNonCoreTagName(coreTagName: string): string {
    const non = isCapitalized(coreTagName) ? "Non" : "non";

    return `${non}–${coreTagName}`;
}

export function createTag(data: PartialExcept<Tag, "name">): Tag {
    return {
        color: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        searchTerm: "",
        ...EMPTY_FOLDER_FILTER,
        filters: [],
        slug: generateSlug(data.name),
        ...data,
    };
}

export function getNonCoreTag(coreTag: Tag): Tag {
    return createTag({
        slug: NON_CORE_TAG_SLUG,
        name: getNonCoreTagName(coreTag.name),
        color: "var(--tag-color-non-core)",
    });
}

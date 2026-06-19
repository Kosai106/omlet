import LZString from "lz-string";
import { generatePath } from "react-router-dom";

import { getColorMap, getNextColor, USER_DEFINED_TAG_COLORS } from "../../../common/colorUtils";
import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { BreakdownType } from "../../../common/models/BreakdownType";
import { type ChartDatum } from "../../../common/models/ChartDatum";
import { type ChartValue } from "../../../common/models/ChartValue";
import { type Filter } from "../../../common/models/Filter";
import { FilterDataType } from "../../../common/models/FilterDataType";
import { FilterOperation } from "../../../common/models/FilterOperation";
import { FilterType } from "../../../common/models/FilterType";
import { type Tag, createTag, NON_CORE_TAG_SLUG, RESERVED_TAGS } from "../../../common/models/Tag";
import { RoutePath } from "../../../common/RoutePath";
import { compareChartDatumTagPercentage, compareProject, compareString, compareTag } from "../../../common/sortUtils";
import { arrayGroup, generateSlug } from "../../../common/utils";
import { config } from "../../../config/backend";
import { ReservedCustomPropertyValue, ReservedProjectName } from "../models";
import { type Project } from "../workspace/workspace";

import { type DataAnalysis } from "./models";

function appendSearchParams(path: string, searchParams: Record<string, string | string[]>): string {
    const url = new URL(path, config.APP_BASE_URL);
    for (const [key, values] of Object.entries(searchParams)) {
        if (Array.isArray(values)) {
            for (const value of values) {
                url.searchParams.append(key, value);
            }
        } else {
            url.searchParams.set(key, values);
        }
    }
    return `${url.pathname}?${url.searchParams.toString()}`;
}

function appendFilter(path: string, filter: Filter): string {
    const url = new URL(path, config.APP_BASE_URL);
    const filtersParam = url.searchParams.get("filters");

    let filters;
    if (filtersParam) {
        filters = JSON.parse(LZString.decompressFromEncodedURIComponent(filtersParam)) as Filter[];
        filters.push(filter);
    } else {
        filters = [filter];
    }

    url.searchParams.set("filters", LZString.compressToEncodedURIComponent(JSON.stringify(filters)));

    return `${url.pathname}?${url.searchParams.toString()}`;
}

interface ChartDatumLinkParams {
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    workspaceSlug: string;
    label: string;
    id: string;
}

function getChartDatumLink({
    analysisSubject,
    customProperty,
    workspaceSlug,
    label,
    id,
}: ChartDatumLinkParams) {
    switch (analysisSubject) {
        case AnalysisSubject.Components:
            return generatePath(RoutePath.ComponentDetail, { workspaceSlug, componentSlug: encodeURIComponent(`${label}::${id}`) });
        case AnalysisSubject.Projects:
            return appendFilter(
                appendSearchParams(
                    generatePath(RoutePath.NewAnalytics, { workspaceSlug }),
                    { subject: AnalysisSubject.Components }
                ),
                {
                    type: FilterType.ProjectUsedIn,
                    operation: FilterOperation.Equals,
                    value: [id],
                }
            );
        case AnalysisSubject.Tags: {
            if (id === NON_CORE_TAG_SLUG) {
                return appendFilter(
                    appendSearchParams(
                        generatePath(RoutePath.NewAnalytics, { workspaceSlug }),
                        { subject: AnalysisSubject.Components }
                    ),
                    {
                        type: FilterType.Tag,
                        operation: FilterOperation.IsNotEqual,
                        value: [RESERVED_TAGS.CORE.slug],
                    }
                );
            } else {
                return appendFilter(
                    appendSearchParams(
                        generatePath(RoutePath.NewAnalytics, { workspaceSlug }),
                        { subject: AnalysisSubject.Components }
                    ),
                    {
                        type: FilterType.Tag,
                        operation: FilterOperation.Equals,
                        value: [id],
                    }
                );
            }
        }
        case AnalysisSubject.CustomProperties: {
            return appendFilter(
                generatePath(RoutePath.Components, { workspaceSlug }),
                {
                    type: FilterType.CustomProperty,
                    field: `metadata.${customProperty}`,
                    operation: FilterOperation.Equals,
                    dataType: FilterDataType.String,
                    value: [id],
                }
            );
        }
    }
}

function getChartValueLink(analysisSubject: AnalysisSubject, breakdownType: BreakdownType, datumLink: string, barId: string, customProperty?: string) {
    if (analysisSubject === AnalysisSubject.Components) {
        switch (breakdownType) {
            case BreakdownType.ProjectUsedIn:
                return appendSearchParams(datumLink, { project: barId });
            default:
                return datumLink;
        }
    }
    switch (breakdownType) {
        case BreakdownType.ProjectDefined:
            return appendFilter(datumLink, {
                type: FilterType.ProjectDefined,
                operation: FilterOperation.Equals,
                value: [barId],
            });
        case BreakdownType.ProjectUsedIn:
            return appendFilter(datumLink, {
                type: FilterType.ProjectUsedIn,
                operation: FilterOperation.Equals,
                value: [barId],
            });
        case BreakdownType.Tag:
            if (barId === NON_CORE_TAG_SLUG) {
                return appendFilter(datumLink, {
                    type: FilterType.Tag,
                    operation: FilterOperation.IsNotEqual,
                    value: [RESERVED_TAGS.CORE.slug],
                });
            } else {
                return appendFilter(datumLink, {
                    type: FilterType.Tag,
                    operation: FilterOperation.Equals,
                    value: [barId],
                });
            }
        case BreakdownType.CustomProperty:
            if (!customProperty || barId === ReservedCustomPropertyValue.NotSet) {
                return datumLink;
            }
            return appendFilter(datumLink, {
                type: FilterType.CustomProperty,
                field: `metadata.${customProperty}`,
                operation: FilterOperation.Equals,
                dataType: FilterDataType.String,
                value: [barId],
            });
        case undefined:
        default:
            return datumLink;
    }
}

export function getAnalysisSubjectGroupKey(analysisSubject: AnalysisSubject): keyof DataAnalysis {
    switch (analysisSubject) {
        case AnalysisSubject.Components:
            return "childDefinitionId";
        case AnalysisSubject.Projects:
            return "parentPackageName";
        case AnalysisSubject.Tags:
            return "childTag";
        case AnalysisSubject.CustomProperties:
            return "parentCustomProperty";
    }
}

function getBreakdownTypeGroupKey(breakdownType: BreakdownType): keyof DataAnalysis {
    switch (breakdownType) {
        case BreakdownType.ProjectDefined:
            return "childPackageName";
        case BreakdownType.ProjectUsedIn:
            return "parentPackageName";
        case BreakdownType.Tag:
            return "childTag";
        case BreakdownType.CustomProperty:
            return "parentCustomProperty";
    }
}

type ComponentMap = Record<string, { packageName: string; componentName: string; tags: Set<string>; }>;

function getComponentMap(analyses: DataAnalysis[]): ComponentMap {
    const componentMap: ComponentMap = {};

    for (const { childDefinitionId, childName, childPackageName, childTag } of analyses) {
        if (!(childDefinitionId in componentMap)) {
            componentMap[childDefinitionId] = { packageName: childPackageName, componentName: childName, tags: childTag ? new Set([childTag]) : new Set() };
        } else if (childTag) {
            componentMap[childDefinitionId].tags.add(childTag);
        }
    }

    return componentMap;
}

function getTotalValue(datum: ChartDatum): number {
    return datum.values.reduce((sum, { value }) => sum + value, 0);
}

function findSumOfUsageCount(analyses: DataAnalysis[]): number {
    const uniqueUsageCounts = analyses.reduce<Record<string, number>>((uniqueCounts, analysis) => {
        const key = `${analysis.parentPackageName}:${analysis.childDefinitionId}`;
        if (!(key in uniqueCounts)) {
            uniqueCounts[key] = analysis.sumOfUsages;
        }

        return uniqueCounts;
    }, {});

    return Object.values(uniqueUsageCounts).reduce((sum, count) => sum + count);
}

function getProject(packageName: string, projectMap: Record<string, Project>): Project {
    // We store the projects from latest analyses
    // If the package name is not in the projectMap,
    // it's a legacy external package.
    return projectMap[packageName] ?? {
        name: packageName,
        packageName: packageName,
        slug: generateSlug(packageName),
        isInternal: false,
    };
}

function getChartValueData(
    key: string,
    componentMap: ComponentMap,
    projectMap: Record<string, Project>,
    tagMap: Record<string, Tag>,
    analysisSubject: AnalysisSubject
): Pick<ChartValue, "id" | "name" | "extra" | "tags"> {
    switch (analysisSubject) {
        case AnalysisSubject.Components: {
            const { componentName: name, packageName, tags } = componentMap[key];
            const extra = projectMap[packageName]?.alias ?? packageName;
            const childTags = [...tags];
            childTags.sort((a, b) => compareTag(tagMap[a], tagMap[b]));

            return { id: key, name, extra, tags: childTags };
        }
        case AnalysisSubject.Tags: {
            const { slug, name } = tagMap[key] ?? { slug: key, name: key };

            return { id: slug, name };
        }
        case AnalysisSubject.Projects:
            return { id: key, name: projectMap[key]?.alias ?? key };

        case AnalysisSubject.CustomProperties: {
            const name = key === ReservedCustomPropertyValue.NotSet
                ? "(not set)"
                : key;

            return { id: name, name };
        }
    }
}

function groupByBreakdownType(analyses: DataAnalysis[], breakdownType: BreakdownType) {
    const breakdownKey = getBreakdownTypeGroupKey(breakdownType);

    return arrayGroup(analyses, analysis => {
        const key = analysis[breakdownKey];

        if (!key) {
            if (breakdownType === BreakdownType.ProjectUsedIn) {
                return ReservedProjectName.None;
            } else if (breakdownType === BreakdownType.Tag) {
                return RESERVED_TAGS.UNTAGGED.slug;
            } else if (breakdownType === BreakdownType.CustomProperty) {
                return ReservedCustomPropertyValue.NotSet;
            }
        }

        return key;
    });
}

interface TransformLatestDataWithoutBreakdownParams {
    analysis: Record<string, DataAnalysis[]>;
    componentMap: ComponentMap;
    projectMap: Record<string, Project>;
    tagMap: Record<string, Tag>;
    workspaceSlug: string;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
}

function transformLatestDataWithoutBreakdown({
    analysis,
    componentMap,
    projectMap,
    tagMap,
    workspaceSlug,
    analysisSubject,
    customProperty,
}: TransformLatestDataWithoutBreakdownParams): ChartDatum[] {
    const reservedTags = Object.fromEntries(Object.values(RESERVED_TAGS).map(reservedTag => [reservedTag.slug, reservedTag]));

    const colorCountMap = (
        analysisSubject === AnalysisSubject.Components || analysisSubject === AnalysisSubject.Tags
            ? getColorMap(USER_DEFINED_TAG_COLORS,
                Object.values(analysis)
                    .map(analyses => analyses.map(({ childTag }) => childTag).filter(Boolean))
                    .filter(childTags => (
                        childTags.length > 0 && childTags.every(tag => !reservedTags[tag])
                        && tagMap[childTags[0]]
                    )).map(childTags => tagMap[childTags[0]].color)
            ) : {}
    );

    return Object.entries(analysis).map(([key, analyses]): ChartDatum => {
        let color: string | undefined;
        let id = "Usage count";
        let name = "Usage count";
        if (analysisSubject === AnalysisSubject.Components || analysisSubject === AnalysisSubject.Tags) {
            const childTags = analyses.map(({ childTag }) => childTag).filter(Boolean);
            const firstChildTag = childTags[0];
            const reservedChildTag = childTags.find(tag => reservedTags[tag]);

            if (reservedChildTag) {
                const reservedTag = reservedTags[reservedChildTag];
                const childTag = tagMap[reservedChildTag];

                color = reservedTag.color;
                id = reservedTag.slug;
                name = childTag?.name ?? reservedTag.name;
            } else if (childTags.length === 0) {
                color = RESERVED_TAGS.UNTAGGED.color;
                id = RESERVED_TAGS.UNTAGGED.slug;
                name = RESERVED_TAGS.UNTAGGED.name;
            } else if (tagMap[firstChildTag] === undefined) {
                color = getNextColor(colorCountMap);
                id = firstChildTag;
                name = firstChildTag;

                tagMap[firstChildTag] = createTag({
                    name: firstChildTag,
                    slug: firstChildTag,
                    color,
                });
                colorCountMap[color] += 1;
            } else {
                ({ color, slug: id, name } = tagMap[firstChildTag]);
            }
        }

        const { id: datumId, name: label, extra, tags } = getChartValueData(key, componentMap, projectMap, tagMap, analysisSubject);
        const link = getChartDatumLink({ analysisSubject, customProperty, workspaceSlug, label, id: datumId });
        return {
            id: datumId,
            label,
            link,
            values: [{
                id,
                name,
                value: findSumOfUsageCount(analyses),
                color,
                link,
                extra,
                tags,
            }],
        };
    });
}

function transformBrokenDownLatestDataAnalysis(
    brokenDownDataAnalyses: Record<string, DataAnalysis[]>,
    projectMap: Record<string, Project>,
    tagMap: Record<string, Tag>,
    analysisSubject: AnalysisSubject,
    breakdownType: BreakdownType,
    datumLink?: string,
    customProperty?: string,
): ChartValue[] {
    let values: ChartValue[];

    switch (breakdownType) {
        case BreakdownType.ProjectDefined:
            values = Object.entries(brokenDownDataAnalyses)
                .map(([projectName, analyses]) => ({
                    id: projectName,
                    name: projectName,
                    link: datumLink && getChartValueLink(analysisSubject, breakdownType, datumLink, projectName),
                    value: findSumOfUsageCount(analyses),
                }));

            values.sort((cv1, cv2) => {
                if (cv1.value === cv2.value) {
                    return compareProject(
                        getProject(cv1.name, projectMap),
                        getProject(cv2.name, projectMap),
                    );
                }

                return cv2.value - cv1.value;
            });
            break;
        case BreakdownType.ProjectUsedIn:
            values = Object.entries(brokenDownDataAnalyses)
                .filter(([projectName]) => projectName !== ReservedProjectName.None)
                .map(([projectName, analyses]) => ({
                    id: projectName,
                    name: projectName,
                    link: datumLink && getChartValueLink(analysisSubject, breakdownType, datumLink, projectName),
                    value: findSumOfUsageCount(analyses),
                }));

            values.sort((a, b) => compareString(a.name, b.name));
            break;
        case BreakdownType.Tag:
            values = Object.entries(brokenDownDataAnalyses)
                .map(([tag, analyses]) => ({
                    id: tag,
                    name: tagMap[tag]?.name ?? tag,
                    color: tagMap[tag]?.color,
                    link: datumLink && getChartValueLink(analysisSubject, breakdownType, datumLink, tag),
                    value: findSumOfUsageCount(analyses),
                }));

            values.sort((a, b) => compareTag(tagMap[a.id], tagMap[b.id]));
            break;
        case BreakdownType.CustomProperty:
            values = Object.entries(brokenDownDataAnalyses)
                .map(([propertyValue, analyses]) => ({
                    id: propertyValue,
                    name: propertyValue === ReservedCustomPropertyValue.NotSet ? "(not set)" : propertyValue,
                    link: datumLink && getChartValueLink(analysisSubject, breakdownType, datumLink, propertyValue, customProperty),
                    value: findSumOfUsageCount(analyses),
                }));

            values.sort((a, b) => {
                if (a.id === ReservedCustomPropertyValue.NotSet) {
                    return 1;
                }
                if (b.id === ReservedCustomPropertyValue.NotSet) {
                    return -1;
                }
                if (a.value === b.value) {
                    return compareString(a.name, b.name);
                }
                return b.value - a.value;
            });
            break;
    }

    return values;
}

interface TransformLatestDataWithBreakdownParams {
    analysis: Record<string, DataAnalysis[]>;
    componentMap: ComponentMap;
    projectMap: Record<string, Project>;
    tagMap: Record<string, Tag>;
    workspaceSlug: string;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    breakdownType: BreakdownType;
}

function transformLatestDataWithBreakdown({
    analysis,
    componentMap,
    projectMap,
    tagMap,
    workspaceSlug,
    analysisSubject,
    customProperty,
    breakdownType,
}: TransformLatestDataWithBreakdownParams): ChartDatum[] {
    const latestDataAnalysisWithBreakdown = Object.fromEntries(
        Object.entries(analysis)
            .map(([key, value]) => [key, groupByBreakdownType(value, breakdownType)])
    );

    return Object.entries(latestDataAnalysisWithBreakdown).map(([key, brokenDownDataAnalyses]): ChartDatum => {
        const { id: datumId, name: label } = getChartValueData(key, componentMap, projectMap, tagMap, analysisSubject);
        const link = getChartDatumLink({ analysisSubject, customProperty, workspaceSlug, label, id: key });
        const values = transformBrokenDownLatestDataAnalysis(brokenDownDataAnalyses, projectMap, tagMap, analysisSubject, breakdownType, link, customProperty);

        return {
            id: datumId,
            label,
            link,
            values,
        };
    });
}

interface TransformLatestDataAnalysisToChartDataParams {
    analysis: Record<string, DataAnalysis[]>;
    projectMap: Record<string, Project>;
    tagMap: Record<string, Tag>;
    workspaceSlug: string;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    breakdownType: BreakdownType | undefined;
}

export function transformLatestDataAnalysisToChartData({
    analysis,
    projectMap,
    tagMap,
    workspaceSlug,
    analysisSubject,
    customProperty,
    breakdownType,
}: TransformLatestDataAnalysisToChartDataParams): ChartDatum[] {
    const componentMap = getComponentMap(Object.values(analysis).flat());

    const chartData = breakdownType === undefined
        ? transformLatestDataWithoutBreakdown({ analysis, componentMap, projectMap, tagMap, workspaceSlug, analysisSubject, customProperty })
        : transformLatestDataWithBreakdown({ analysis, componentMap, projectMap, tagMap, workspaceSlug, analysisSubject, customProperty, breakdownType });

    if (analysisSubject === AnalysisSubject.Tags) {
        chartData.sort((a, b) => {
            if (breakdownType) {
                return compareTag(tagMap[a.id], tagMap[b.id]);
            }
            if (a.id === RESERVED_TAGS.UNTAGGED.slug) {
                return 1;
            }
            if (b.id === RESERVED_TAGS.UNTAGGED.slug) {
                return -1;
            }
            return (getTotalValue(b) - getTotalValue(a)) || compareTag(tagMap[a.id], tagMap[b.id]);
        });
    } else if (breakdownType === BreakdownType.Tag) {
        chartData.sort(compareChartDatumTagPercentage);
    } else if (breakdownType === BreakdownType.ProjectUsedIn) {
        chartData.sort((a, b) => {
            if (b.values.length === a.values.length) {
                return compareString(a.label, b.label);
            }

            return b.values.length - a.values.length;
        });
    } else {
        chartData.sort((a, b) => {
            if (a.values[0].value === b.values[0].value) {
                return compareString(a.label, b.label);
            }

            return b.values[0].value - a.values[0].value;
        });
    }

    return chartData;
}

export function transformOverTimeDataAnalysisToChartData(
    analyses: Record<string, Record<string, DataAnalysis[]>>,
    projectMap: Record<string, Project>,
    tagMap: Record<string, Tag>,
    analysisSubject: AnalysisSubject,
): ChartDatum[] {
    const componentMap = getComponentMap(Object.values(analyses).map(analysis => Object.values(analysis)).flat(2));

    let chartData: ChartDatum[] = Object.entries(analyses).map(([analysisDate, groupedAnalyses]) => {
        const values: ChartValue[] = Object.entries(groupedAnalyses)
            .map(([key, analyses]) => {
                const { id: datumId, name, extra, tags } = getChartValueData(key, componentMap, projectMap, tagMap, analysisSubject);
                return {
                    id: datumId,
                    name,
                    extra,
                    // TODO: check if reduce should be replaced with findSumOfUsageCount
                    value: analyses.reduce((sum, analysis) => sum + analysis.sumOfUsages, 0),
                    tags,
                };
            });

        return { id: analysisDate, label: analysisDate, values };
    });

    // Insert missing data points for each date
    // for example, in date T let's say there are 2 items (e.g. components), and in date T+1 there are 3 items
    // in order for chart to work properly the data points in each date must be consistent
    // so we're adding that missing item to date T with value 0
    const allIds = new Set(chartData.flatMap(({ values }) => values.map(({ id }) => id)));
    chartData = chartData.map(({ id, label, values }) => {
        const ids = new Set(values.map(({ id }) => id));
        const missingIds = [...allIds].filter(id => !ids.has(id));
        const newValues: ChartValue[] = [
            ...values,
            ...missingIds.map(id => {
                const { id: datumId, name, extra } = getChartValueData(id, componentMap, projectMap, tagMap, analysisSubject);

                return {
                    id: datumId,
                    name,
                    extra,
                    value: 0,
                };
            }),
        ];

        switch (analysisSubject) {
            case AnalysisSubject.Components:
                newValues.sort((a, b) => {
                    if (a.value === b.value) {
                        return compareString(a.name, b.name);
                    }

                    return b.value - a.value;
                });
                break;
            case AnalysisSubject.Projects:
                newValues.sort((a, b) => compareString(a.name, b.name));
                break;
            case AnalysisSubject.Tags:
                newValues.sort((a, b) => compareTag(tagMap[a.id], tagMap[b.id]));
                newValues.forEach(value => {
                    value.color = tagMap[value.id]?.color;
                });
                break;
            case AnalysisSubject.CustomProperties:
                newValues.sort((a, b) => compareString(a.name, b.name));
                break;
        }

        return { id, label, values: newValues };
    });

    chartData.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

    return chartData;
}

export const csvHeader = [`"Analysis date"`, `"Component name"`, `"Project it's from"`, `"Project it's used in"`, `"Tags"`, `"Number of usages"`];

function escapeCSVValue(value: string): string {
    return value.replace(/"/g, `""`);
}

function transformDataAnalysisToCSV(
    analysis: DataAnalysis[],
    tagMap: Record<string, Tag>,
    projectMap: Record<string, Project>,
    customProperty?: string,
) {
    const analysisWithISODate = analysis.map(item => ({
        ...item,
        analysisDate: new Date(item.analysisDate).toISOString(),
    }));
    const analysisByDate = arrayGroup(analysisWithISODate, item => item.analysisDate);
    const analysisByDateAndComponent = Object.fromEntries(
        Object.entries(analysisByDate)
            .map(([key, value]) => [key, arrayGroup(value, item => item.childDefinitionId)])
    );

    const csvLines = Object.entries(analysisByDateAndComponent)
        .sort(([d1], [d2]) => compareString(d1, d2))
        .flatMap(([analysisDate, componentEntries]) =>
            Object.entries(componentEntries)
                .sort(([c1], [c2]) => compareString(c1, c2))
                .flatMap(([, analyses]) => {
                    const tags = [
                        ...new Set(
                            analyses
                                .sort((a, b) => compareTag(tagMap[a.childTag], tagMap[b.childTag]))
                                .map(({ childTag }) => tagMap[childTag]?.name ?? childTag)
                        )]
                        .join(",");

                    return analyses.map(({ parentPackageName, childPackageName, childName, sumOfUsages, parentCustomProperty }) => {
                        const resolvedChildPackageName = projectMap[childPackageName]?.alias ?? childPackageName;
                        const resolvedParentPackageName = parentPackageName ? (projectMap[parentPackageName]?.alias ?? parentPackageName) : "";
                        const cssRowArray = [
                            `"${analysisDate}"`,
                            `"${childName}"`,
                            `"${resolvedChildPackageName}"`,
                            `"${resolvedParentPackageName}"`,
                            `"${escapeCSVValue(tags)}"`,
                            `"${sumOfUsages}"`,
                        ];

                        if (customProperty !== undefined) {
                            cssRowArray.push(`"${escapeCSVValue(parentCustomProperty) ?? ""}"`);
                        }

                        return cssRowArray.join(",");
                    });
                })
        )
        .join("\n");

    const header = customProperty === undefined
        ? csvHeader
        : [...csvHeader, `"Parent custom property: ${customProperty}"`];

    return `${header}\n${csvLines}`;
}

export function transformLatestDataAnalysisToCSV(
    analysis: Record<string, DataAnalysis[]>,
    tagMap: Record<string, Tag>,
    projectMap: Record<string, Project>,
    customProperty?: string,
): string {
    const analyses = Object.values(analysis).flat();
    return transformDataAnalysisToCSV(analyses, tagMap, projectMap, customProperty);
}

export function transformOverTimeDataAnalysisToCSV(
    analysis: Record<string, Record<string, DataAnalysis[]>>,
    tagMap: Record<string, Tag>,
    projectMap: Record<string, Project>,
    customProperty?: string,
): string {
    const analyses = Object.values(analysis).map(analysis => Object.values(analysis)).flat(2);
    return transformDataAnalysisToCSV(analyses, tagMap, projectMap, customProperty);
}

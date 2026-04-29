import { CHART_COLORS, getColorMap, getNextColor, USER_DEFINED_TAG_COLORS } from "../../../common/colorUtils";
import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { AnalysisType } from "../../../common/models/AnalysisType";
import { BreakdownType } from "../../../common/models/BreakdownType";
import { type ChartDatum } from "../../../common/models/ChartDatum";
import { type Project } from "../../../common/models/Project";
import { type Tag, RESERVED_TAGS } from "../../../common/models/Tag";
import { compareProject, compareString, compareTag } from "../../../common/sortUtils";
import { generateSlug } from "../../../common/utils";

import { type LegendItem } from "./legend/LegendItem";

function getTooltip(item: LegendItem, analysisSubject: AnalysisSubject, breakdownType?: BreakdownType) {
    if (![AnalysisSubject.Tags, AnalysisSubject.Components].includes(analysisSubject) && breakdownType !== BreakdownType.Tag) {
        return undefined;
    }
    const reservedTag = Object.values(RESERVED_TAGS).find(({ slug }) => slug === item.id);
    return reservedTag?.tooltip;
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

export function getLegendItems(
    data: ChartDatum[],
    projectMap: Record<string, Project>,
    tagMap: Record<string, Tag>,
    analysisType: AnalysisType,
    analysisSubject: AnalysisSubject,
    breakdownType?: BreakdownType
): LegendItem[] {
    const idSet = new Set();
    const legendItems: LegendItem[] = [];

    for (const { values } of data) {
        for (const { id, name, color } of values) {
            if (!idSet.has(id)) {
                idSet.add(id);
                legendItems.push({ id, name, color });
            }
        }
    }

    switch (breakdownType) {
        case BreakdownType.ProjectDefined:
        case BreakdownType.ProjectUsedIn:
            legendItems.sort((a, b) => compareProject(getProject(a.name, projectMap), getProject(b.name, projectMap)));
            break;

        case BreakdownType.Tag:
            legendItems.sort((a, b) => compareTag(tagMap[a.id], tagMap[b.id]));
            break;

        default:
            if (
                (analysisType === AnalysisType.LatestData && analysisSubject === AnalysisSubject.Components) ||
                (analysisType === AnalysisType.DataOverTime && analysisSubject === AnalysisSubject.Tags)
            ) {
                legendItems.sort((a, b) => compareTag(tagMap[a.id], tagMap[b.id]));
                break;
            }
            legendItems.sort((a, b) => compareString(a.name, b.name));
            break;
    }

    const colors = analysisSubject === AnalysisSubject.Tags || breakdownType === BreakdownType.Tag ? USER_DEFINED_TAG_COLORS : CHART_COLORS;
    const colorMap = getColorMap(
        colors,
        legendItems.map(i => i.color).filter((c): c is string => Boolean(c)),
    );

    return legendItems.map(item => {
        if (item.color) {
            return {
                ...item,
                tooltip: getTooltip(item, analysisSubject, breakdownType),
            };
        }
        const color = getNextColor(colorMap);
        colorMap[color] += 1;
        return {
            ...item,
            color,
            tooltip: getTooltip(item, analysisSubject, breakdownType),
        };
    });
}

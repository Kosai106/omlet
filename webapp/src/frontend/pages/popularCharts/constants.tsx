import { type ReactNode } from "react";

import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { AnalysisType } from "../../../common/models/AnalysisType";
import { BreakdownType } from "../../../common/models/BreakdownType";
import { type ArrayFilter, type Filter, hasSameFilters } from "../../../common/models/Filter";
import { FilterOperation } from "../../../common/models/FilterOperation";
import { FilterType } from "../../../common/models/FilterType";
import { type Tag, getCoreTag, getNonCoreTag } from "../../../common/models/Tag";
import { SortType } from "../../models/SortType";

export enum PredefinedChartType {
    ComponentAdoptionOverTime = "componentAdoptionOverTime",
    CoreAdoptionByProject = "coreAdoptionByProject",
    CoreUsageOverTime = "coreUsageOverTime",
    RecentlyCreatedComponents = "recentlyCreatedComponents",
    MostUsedNonCoreComponents = "mostUsedNonCoreComponents",
    MostUsedComponents = "mostUsedComponents",
    ComponentUsageOverTime = "componentUsageOverTime",
}

export enum PredefinedTableType {
    UnusedComponentProps = "unusedComponentProps",
    LeastUsedCoreComponents = "leastUsedCoreComponents",
}

const now = new Date();
const thirtyDaysAgo = new Date(now);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const sixtyDaysAgo = new Date(now);
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
const ninetyDaysAgo = new Date(now);
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

interface ChartFallback {
    filters: Filter[];
    description: string;
}

export interface PredefinedChart {
    chartType: PredefinedChartType;
    analysisType: AnalysisType;
    analysisSubject: AnalysisSubject;
    filters: Filter[];
    nonCoreFilters?: Filter[];
    breakdownType?: BreakdownType;
    fallbacks?: ChartFallback[];
    title: string;
    description: string;
    emptyStateMessage: ReactNode;
}

export function getPredefinedCharts(coreTag: Tag, hasUserDefinedTags: boolean): PredefinedChart[] {
    const nonCoreTag = getNonCoreTag(coreTag);

    const charts: PredefinedChart[] = [{
        chartType: PredefinedChartType.CoreAdoptionByProject,
        analysisType: AnalysisType.LatestData,
        analysisSubject: AnalysisSubject.Projects,
        breakdownType: BreakdownType.Tag,
        filters: [{
            type: FilterType.Tag,
            operation: FilterOperation.Equals,
            value: [coreTag.slug],
        }],
        nonCoreFilters: [{
            type: FilterType.Tag,
            operation: FilterOperation.IsNotEqual,
            value: [coreTag.slug],
        }],
        title: `${coreTag.name} vs. ${nonCoreTag.name} Adoption by Project`,
        description: `${coreTag.name} component adoption rate per project based on total usage`,
        emptyStateMessage: <span>No component usage</span>,
    }, (
        hasUserDefinedTags
            ? {
                chartType: PredefinedChartType.CoreUsageOverTime,
                analysisType: AnalysisType.DataOverTime,
                analysisSubject: AnalysisSubject.Tags,
                filters: [{
                    type: FilterType.Tag,
                    operation: FilterOperation.Equals,
                    value: [coreTag.slug],
                }],
                title: `${coreTag.name} Component Usage Over Time`,
                description: `Change in total ${coreTag.name} component usage over time`,
                emptyStateMessage: <span>No {coreTag.name} component</span>,
            }
            : getComponentAdoptionOverTimeChart(coreTag, nonCoreTag)
    ), {
        chartType: PredefinedChartType.RecentlyCreatedComponents,
        analysisType: AnalysisType.LatestData,
        analysisSubject: AnalysisSubject.Components,
        filters: [{
            type: FilterType.CreatedDate,
            operation: FilterOperation.Between,
            value: [thirtyDaysAgo.toISOString(), now.toISOString()],
        }],
        title: "Recently Created Components",
        description: "List of components created in the last 30 days",
        fallbacks: [{
            filters: [{
                type: FilterType.CreatedDate,
                operation: FilterOperation.Between,
                value: [sixtyDaysAgo.toISOString(), now.toISOString()],
            }],
            description: "List of components created in the last 60 days",
        }, {
            filters: [{
                type: FilterType.CreatedDate,
                operation: FilterOperation.Between,
                value: [ninetyDaysAgo.toISOString(), now.toISOString()],
            }],
            description: "List of components created in the last 90 days",
        }],
        emptyStateMessage: <span>No recently created components</span>,
    }, {
        chartType: PredefinedChartType.MostUsedNonCoreComponents,
        analysisType: AnalysisType.LatestData,
        analysisSubject: AnalysisSubject.Components,
        filters: [{
            type: FilterType.Tag,
            operation: FilterOperation.IsNotEqual,
            value: [coreTag.slug],
        }],
        title: `Most Used ${nonCoreTag.name} Components`,
        description: `List of ${nonCoreTag.name} components sorted by how many times they’re used`,
        emptyStateMessage: <span>No {nonCoreTag.name} components</span>,
    }, {
        chartType: PredefinedChartType.MostUsedComponents,
        analysisType: AnalysisType.LatestData,
        analysisSubject: AnalysisSubject.Components,
        filters: [],
        title: "Most Used Components",
        description: "List of all components sorted by how many times they’re used",
        emptyStateMessage: <span>No component usage</span>,
    }, {
        chartType: PredefinedChartType.ComponentUsageOverTime,
        analysisType: AnalysisType.DataOverTime,
        analysisSubject: AnalysisSubject.Components,
        filters: [],
        title: "Individual Component Usage Over Time",
        description: "Usage trend for each component",
        emptyStateMessage: <span>No component usage</span>,
    }];

    return charts;
}

export function getMainChart(coreTag: Tag, otherTag: Tag, hasUserDefinedTags: boolean): PredefinedChart {
    if (hasUserDefinedTags) {
        return getComponentAdoptionOverTimeChart(coreTag, otherTag);
    }

    return {
        chartType: PredefinedChartType.CoreUsageOverTime,
        analysisType: AnalysisType.DataOverTime,
        analysisSubject: AnalysisSubject.Tags,
        filters: [{
            type: FilterType.Tag,
            operation: FilterOperation.Equals,
            value: [coreTag.slug],
        }],
        title: `${coreTag.name} Component Usage Over Time`,
        description: `Change in total ${coreTag.name} component usage over time`,
        emptyStateMessage: <span>No component usage</span>,
    };
}

export function getComponentAdoptionOverTimeChart(coreTag: Tag, otherTag: Tag): PredefinedChart {
    const chart: PredefinedChart = {
        chartType: PredefinedChartType.ComponentAdoptionOverTime,
        analysisType: AnalysisType.DataOverTime,
        analysisSubject: AnalysisSubject.Tags,
        filters: [{
            type: FilterType.Tag,
            operation: FilterOperation.Equals,
            value: [coreTag.slug],
        }],
        title: `${coreTag.name} Adoption Over Time`,
        description: `Change in ${coreTag.name} vs. ${otherTag.name} component usage over time`,
        emptyStateMessage: <span>No component usage</span>,
    };

    const nonCoreTag = getNonCoreTag(coreTag);
    if (otherTag.slug === nonCoreTag.slug) {
        chart.nonCoreFilters = [{
            type: FilterType.Tag,
            operation: FilterOperation.IsNotEqual,
            value: [coreTag.slug],
        }];
    } else {
        chart.filters[0].value.push(otherTag.slug);
    }

    return chart;
}

export function getPredefinedTables(coreTag: Tag) {
    return [{
        tableType: PredefinedTableType.UnusedComponentProps,
        title: "Unused Component Props",
        description: "List of unused component props sorted by how many times the component is used",
        emptyStateMessage: <span>No unused component props — <em>props</em> to you!</span>,
        emptyStateKaomoji: "(◡ ‿ ◡ .)",
    }, {
        tableType: PredefinedTableType.LeastUsedCoreComponents,
        params: {
            limit: 5,
            sort_key: SortType.Usage,
            sort_ascending: "true",
        },
        filters: [{
            type: FilterType.Tag,
            operation: FilterOperation.Equals,
            value: [coreTag.slug],
        } as ArrayFilter],
        title: `Least Used ${coreTag.name} Components`,
        description: `List of ${coreTag.name} components that are used infrequently`,
        emptyStateMessage: <span>No Pajamas components</span>,
    }];
}

type DashboardSection = {
    title: string;
    description: string;
    youtubeVideoId?: string;
} & ({
    charts: PredefinedChartType[];
    tables?: never;
} | {
    charts?: never;
    tables: PredefinedTableType[];
});

export function getDashboardSections(hasUserDefinedTags: boolean): DashboardSection[] {
    return [{
        title: "How Is Our Design System Used Overall?",
        description: hasUserDefinedTags
            ? "Analyze component adoption across different projects or see changes in design system component usage over time."
            : "Analyze component adoption across different projects or compare adoption trend amongst different groups of components.",
        youtubeVideoId: "MVBiVUxss7U",
        charts: [
            PredefinedChartType.CoreAdoptionByProject,
            hasUserDefinedTags ? PredefinedChartType.CoreUsageOverTime : PredefinedChartType.ComponentAdoptionOverTime,
        ],
    }, {
        title: "How Can I Increase Design System Adoption?",
        description: "See your most used non-design system components and recently created components to potentially replace them with design system components.",
        youtubeVideoId: "VKmYlsAcb_Q",
        charts: [PredefinedChartType.MostUsedNonCoreComponents, PredefinedChartType.RecentlyCreatedComponents],
    }, {
        title: "How Can I Simplify the Code Library?",
        description: "Time for a clean up! Using the charts below, you can see the components or props that your team is not using and remove them.",
        youtubeVideoId: "V0WZBHsYaNc",
        tables: [PredefinedTableType.UnusedComponentProps, PredefinedTableType.LeastUsedCoreComponents],
    }];
}

export function findPredefinedChart(
    tags: Tag[],
    analysisType: AnalysisType,
    analysisSubject: AnalysisSubject | undefined,
    filters: Filter[],
    breakdownType: BreakdownType | undefined
): PredefinedChart | undefined {
    const coreTag = getCoreTag(tags);
    const nonCoreTag = getNonCoreTag(coreTag);

    const populatedPredefinedCharts = [
        getComponentAdoptionOverTimeChart(coreTag, nonCoreTag),
        ...getPredefinedCharts(coreTag, true).flatMap(
            chart => [chart, ...(chart.fallbacks ?? []).map(fallback => ({ ...chart, ...fallback }))]
        ),
    ];

    return populatedPredefinedCharts.find(
        predefinedChart => (
            predefinedChart.analysisType === analysisType
            && predefinedChart.analysisSubject === analysisSubject
            && predefinedChart.breakdownType === breakdownType
            && !predefinedChart.nonCoreFilters
            && hasSameFilters(predefinedChart.filters, filters)
        )
    );
}

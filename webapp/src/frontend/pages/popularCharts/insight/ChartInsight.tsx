import { type ReactNode, useMemo } from "react";

import { type Emoji } from "emoji-type";

import { AnalysisType } from "../../../../common/models/AnalysisType";
import { type ChartDatum } from "../../../../common/models/ChartDatum";
import { type ChartValue } from "../../../../common/models/ChartValue";
import { type Tag, getCoreTag, getNonCoreTag } from "../../../../common/models/Tag";
import { pluralize } from "../../../../common/utils";
import { Callout } from "../../../library/Callout/Callout";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import {
    formatList,
    formatPercentage,
    getRandomItem,
    isAlmostEqual,
} from "../../../utils";
import { PredefinedChartType } from "../constants";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function findTagValue(values: ChartValue[], tag: Tag): number {
    return values.find(v => v.id === tag.slug)?.value ?? 0;
}

function SetupRegularScansInsightContent() {
    const {
        actions: {
            setIsSetupRegularScansDialogVisible,
        },
    } = useStore();

    return (
        <>
            As you scan your projects regularly, you will see trends in component usage in this chart.{" "}
            <button
                type="button"
                onClick={() => setIsSetupRegularScansDialogVisible(true)}>
                Learn more
            </button>{" "}
            about setting up regular scans.
        </>
    );
}

interface ChartInsightResult {
    content: ReactNode;
    emoji?: Emoji;
}

interface Props {
    className?: string;
    chartType?: PredefinedChartType;
    analysisType?: AnalysisType;
    data?: ChartDatum[];
    numOfAnalyses: number;
    comparedTag?: Tag;
}

export function ChartInsight({
    className,
    chartType,
    analysisType,
    data,
    numOfAnalyses,
    comparedTag,
}: Props) {
    const { selectors: { getTags } } = useStore();

    const tags = getTags();
    const coreTag = useMemo(() => getCoreTag(tags), [tags]);
    const coreTagName = coreTag.name;
    const nonCoreTag = getNonCoreTag(coreTag);

    function getCoreAdoptionRate(values: ChartValue[], otherTag: Tag): number {
        const coreValue = findTagValue(values, coreTag);
        const otherTagValue = findTagValue(values, otherTag);
        return coreValue + otherTagValue === 0 ? 0 : coreValue / (coreValue + otherTagValue);
    }

    function getComponentAdoptionOverTimeInsight(data: ChartDatum[]): ReactNode {
        if (numOfAnalyses === 1) {
            return <SetupRegularScansInsightContent />;
        }

        if (data.length < 2) {
            return null;
        }

        const insights: ReactNode[] = [];

        const lastScan = data[data.length - 1];
        const lastScanDate = new Date(lastScan.id);

        let index = data.length - 2;
        let previousScan = data[index];
        while (
            --index >= 0 &&
            new Date(previousScan.id).getTime() > lastScanDate.getTime() - THIRTY_DAYS
        ) {
            previousScan = data[index];
        }

        const lastScanAbsolute = findTagValue(lastScan.values, coreTag);
        const previousScanAbsolute = findTagValue(previousScan.values, coreTag);

        if (lastScanAbsolute === previousScanAbsolute) {
            insights.push(`${coreTagName} component usage number hasn’t changed in the past 30 days.`);
        } else {
            const absoluteChangeType = lastScanAbsolute > previousScanAbsolute ? "increased" : "decreased";
            const absoluteChange = Math.abs(lastScanAbsolute - previousScanAbsolute);

            insights.push(`${coreTagName} component usage number has ${absoluteChangeType} by ${absoluteChange} in the past 30 days.`);
        }

        const lastScanPercentage = getCoreAdoptionRate(lastScan.values, comparedTag ?? nonCoreTag);
        const previousScanPercentage = getCoreAdoptionRate(previousScan.values, comparedTag ?? nonCoreTag);

        if (isAlmostEqual(lastScanPercentage, previousScanPercentage)) {
            insights.push(`${coreTagName} component usage rate hasn’t changed in the past 30 days.`);
        } else {
            const percentageChangeType = lastScanPercentage > previousScanPercentage ? "increased" : "decreased";
            const percentageChange = formatPercentage(Math.abs(lastScanPercentage - previousScanPercentage));

            insights.push(`${coreTagName} component usage rate has ${percentageChangeType} by ${percentageChange} in the past 30 days.`);
        }

        return getRandomItem(insights);
    }

    function getCoreUsageOverTimeInsight(data: ChartDatum[]): ReactNode {
        if (numOfAnalyses === 1) {
            return <SetupRegularScansInsightContent />;
        }

        if (data.length < 2) {
            return null;
        }

        const insights: ReactNode[] = [];

        const lastScan = data[data.length - 1];
        const lastScanDate = new Date(lastScan.id);

        let index = data.length - 2;
        let previousScan = data[index];
        while (
            --index >= 0 &&
            new Date(previousScan.id).getTime() > lastScanDate.getTime() - THIRTY_DAYS
        ) {
            previousScan = data[index];
        }

        const lastScanAbsolute = findTagValue(lastScan.values, coreTag);
        const previousScanAbsolute = findTagValue(previousScan.values, coreTag);

        if (lastScanAbsolute === previousScanAbsolute) {
            insights.push(`${coreTagName} component usage number hasn’t changed in the past 30 days.`);
        } else {
            const absoluteChangeType = lastScanAbsolute > previousScanAbsolute ? "increased" : "decreased";
            const absoluteChange = Math.abs(lastScanAbsolute - previousScanAbsolute);

            insights.push(`${coreTagName} component usage number has ${absoluteChangeType} by ${absoluteChange} in the past 30 days.`);
        }

        return getRandomItem(insights);
    }

    function getCoreAdoptionByProjectInsight(data: ChartDatum[]): ReactNode {
        if (data.length < 2) {
            return null;
        }

        const insights: ReactNode[] = [];

        const percentages = data.map(
            ({ label, values }) => ({
                project: label,
                percentage: getCoreAdoptionRate(values, nonCoreTag),
            })
        );
        percentages.sort(({ percentage: p1 }, { percentage: p2 }) => p1 - p2);

        const lowestPercentage = percentages[0];
        const lowestPercentages = percentages.filter(({ percentage }) => percentage === lowestPercentage.percentage);

        if (lowestPercentages.length === 1) {
            insights.push(`${lowestPercentage.project} has the lowest ${coreTagName} component adoption rate among all projects.`);
        } else {
            insights.push(`${formatList(lowestPercentages.map(({ project }) => project), { limit: 3 })} have the lowest ${coreTagName} component adoption rate among all projects.`);
        }

        const coreValues = data.map(
            ({ label, values }) => ({
                project: label,
                value: findTagValue(values, coreTag),
            })
        );
        coreValues.sort(({ value: v1 }, { value: v2 }) => v1 - v2);

        const lowestCoreValue = coreValues[0];
        const lowestCoreValues = coreValues.filter(({ value }) => value === lowestCoreValue.value);

        if (lowestCoreValues.length === 1) {
            insights.push(`${lowestCoreValue.project} is using the lowest number of ${coreTagName} components.`);
        } else {
            insights.push(`${formatList(lowestCoreValues.map(({ project }) => project), { limit: 3 })} are using the lowest number of ${coreTagName} components.`);
        }

        const nonCoreValues = data.map(
            ({ label, values }) => ({
                project: label,
                value: findTagValue(values, nonCoreTag),
            })
        );
        nonCoreValues.sort(({ value: v1 }, { value: v2 }) => v2 - v1);

        const highestNonCoreValue = nonCoreValues[0];
        const highestNonCoreValues = nonCoreValues.filter(({ value }) => value === highestNonCoreValue.value);

        if (highestNonCoreValues.length === 1) {
            insights.push(`${highestNonCoreValue.project} is using the highest number of ${nonCoreTag.name} components.`);
        } else {
            insights.push(`${formatList(highestNonCoreValues.map(({ project }) => project), { limit: 3 })} are using the highest number of ${nonCoreTag.name} components.`);
        }

        return getRandomItem(insights);
    }

    function getRecentlyCreatedComponentsInsight(data: ChartDatum[]): ReactNode {
        const mostUsedRecentNonCoreComponent = data.find(({ values: [{ tags }] }) => !tags || !tags.includes(coreTag.slug));
        if (!mostUsedRecentNonCoreComponent) {
            return null;
        }

        const mostUsedRecentNonCoreComponents = data.filter(({ values: [{ value, tags }] }) =>
            !tags || !tags.includes(coreTag.slug) && value === mostUsedRecentNonCoreComponent.values[0].value
        );

        if (mostUsedRecentNonCoreComponents.length === 1) {
            return `${mostUsedRecentNonCoreComponent.label} is a new ${nonCoreTag.name} component that’s used a lot.`;
        } else {
            return `${formatList(mostUsedRecentNonCoreComponents.map(({ label }) => label), { limit: 3 })} are new ${nonCoreTag.name} components which are used a lot.`;
        }
    }

    const NON_CORE_USAGE_THRESHOLDS = [5, 10, 25, 50, 100];

    function getMostUsedNonCoreComponentsInsight(data: ChartDatum[]): ReactNode {
        const insights: ReactNode[] = [];

        insights.push(`There are total ${pluralize(`${nonCoreTag.name} component`, data.length)} used accross your projects.`);

        let componentsAboveThreshold = data;
        for (const threshold of NON_CORE_USAGE_THRESHOLDS) {
            componentsAboveThreshold = componentsAboveThreshold.filter(({ values: [{ value }] }) => value > threshold);
            const usageAboveThreshold = componentsAboveThreshold.length;

            if (usageAboveThreshold > 0) {
                insights.push(`There are ${pluralize(`${nonCoreTag.name} component`, usageAboveThreshold)} used more than ${threshold} times across your projects.`);
            } else {
                break;
            }
        }

        return getRandomItem(insights);
    }

    function getMostUsedComponentsInsight(data: ChartDatum[]): ReactNode {
        const mostUsedNonCoreComponent = data.find(({ values: [{ tags }] }) => !tags || !tags.includes(coreTag.slug));
        if (!mostUsedNonCoreComponent) {
            return null;
        }

        const mostUsedNonCoreComponents = data.filter(({ values: [{ value, tags }] }) =>
            !tags || !tags.includes(coreTag.slug) && value === mostUsedNonCoreComponent.values[0].value
        );

        if (mostUsedNonCoreComponents.length === 1) {
            return `${mostUsedNonCoreComponent.label} is the ${nonCoreTag.name} component with the highest number of usage`;
        } else {
            return `${formatList(mostUsedNonCoreComponents.map(({ label }) => label), { limit: 3 })} are the ${nonCoreTag.name} components with the highest number of usage.`;
        }
    }

    function getComponentUsageOverTimeInsight(data: ChartDatum[]): ReactNode {
        if (numOfAnalyses === 1) {
            return <SetupRegularScansInsightContent />;
        }

        if (data.length < 2) {
            return null;
        }

        const insights = [];

        const lastScan = data[data.length - 1];
        insights.push(`${lastScan.values[0].name} is the most used component in the most recent analysis.`);

        const previousScan = data[data.length - 2];
        let componentWithMostIncrease;
        let componentWithMostDecrease;
        let increase = 0;
        let decrease = 0;
        for (const component of lastScan.values) {
            const foundComponent = previousScan.values.find(({ id: valueId }) => valueId === component.id)!;

            const diff = component.value - foundComponent.value;
            if (diff === 0) {
                continue;
            } else if (diff > increase) {
                componentWithMostIncrease = foundComponent.name;
                increase = diff;
            } else if (diff < decrease) {
                componentWithMostDecrease = foundComponent.name;
                decrease = diff;
            }
        }

        if (componentWithMostIncrease) {
            insights.push(`${componentWithMostIncrease} has been used the most since the last scan.`);
        }

        if (componentWithMostDecrease) {
            insights.push(`The usage of ${componentWithMostDecrease} decreased the most since the last scan.`);
        }

        return getRandomItem(insights);
    }

    function getNonCoreChartInsight(data: ChartDatum[], analysisType?: AnalysisType): ReactNode {
        if (data.length === 1 && analysisType === AnalysisType.DataOverTime) {
            return <SetupRegularScansInsightContent />;
        }
        return null;
    }

    function getPredefinedChartInsight(data?: ChartDatum[], chartType?: PredefinedChartType, analysisType?: AnalysisType): ChartInsightResult {
        if (data === undefined || data.length === 0) {
            return { content: null };
        }

        switch (chartType) {
            case PredefinedChartType.ComponentAdoptionOverTime:
                return { content: getComponentAdoptionOverTimeInsight(data) };

            case PredefinedChartType.CoreUsageOverTime:
                return { content: getCoreUsageOverTimeInsight(data) };

            case PredefinedChartType.CoreAdoptionByProject:
                return { content: getCoreAdoptionByProjectInsight(data) };

            case PredefinedChartType.RecentlyCreatedComponents:
                return { content: getRecentlyCreatedComponentsInsight(data) };

            case PredefinedChartType.MostUsedNonCoreComponents:
                return { content: getMostUsedNonCoreComponentsInsight(data) };

            case PredefinedChartType.MostUsedComponents:
                return { content: getMostUsedComponentsInsight(data) };

            case PredefinedChartType.ComponentUsageOverTime:
                return { content: getComponentUsageOverTimeInsight(data) };

            default:
                return { content: getNonCoreChartInsight(data, analysisType) };
        }
    }

    const { content, emoji = "💡" } = useMemo(() => getPredefinedChartInsight(data, chartType, analysisType), [chartType, JSON.stringify(data), analysisType]);

    if (!content) {
        return null;
    }

    return (
        <Callout className={className} emoji={emoji}>
            {content}
        </Callout>
    );
}

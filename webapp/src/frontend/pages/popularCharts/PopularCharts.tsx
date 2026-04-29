import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import classNames from "classnames";
import { generatePath, useParams } from "react-router-dom";

import { getCoreTag, getNonCoreTag, RESERVED_TAGS, type Tag } from "../../../common/models/Tag";
import { RoutePath } from "../../../common/RoutePath";
import { Tooltip } from "../../library/Tooltip/Tooltip";
import { AccessLevel } from "../../models/AccessLevel";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

import {
    getDashboardSections,
    getPredefinedCharts,
    getPredefinedTables,
    PredefinedChartType,
    type PredefinedTableType,
} from "./constants";
import { DashboardSection } from "./dashboardSection/DashboardSection";
import { DashboardSectionHeader } from "./dashboardSectionHeader/DashboardSectionHeader";
import { PlayButton } from "./dashboardSectionHeader/playButton/PlayButton";
import { DashboardTable } from "./dashboardTable/DashboardTable";
import { DropdownTags } from "./dropdownTags/DropdownTags";
import { MainChart } from "./mainChart/MainChart";
import { PopularDashboardChart } from "./popularDashboardChart/PopularDashboardChart";
import { YoutubePlayer } from "./youtubePlayer/YoutubePlayer";

import classes from "./PopularCharts.module.css";

interface StrongTextWithTooltipProps {
    text: string;
    tooltip: string;
}

function StrongTextWithTooltip({
    text,
    tooltip,
}: StrongTextWithTooltipProps) {
    const ref = useRef<HTMLElement>(null);

    return (
        <Tooltip content={tooltip}>
            <strong
                className={classes.strongTextWithTooltip}
                ref={ref}>
                {text}
            </strong>
        </Tooltip>
    );
}

function areAllLoaded(loadedEntities: Record<string, boolean>): boolean {
    return Object.values(loadedEntities).every(isLoaded => isLoaded);
}

export function PopularCharts() {
    const { workspaceSlug } = useParams();

    const scrollPositionRef = useRef<number>(0);
    const mainRef = useRef<HTMLElement>(null);

    const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

    const {
        selectors: {
            getTags,
            getWorkspace,
            getAccessLevel,
            getDashboardScrollPosition,
        },
        actions: {
            setAnalyticsURL,
            setDashboardURL,
            setDashboardScrollPosition,
        },
    } = useStore();

    const initialScrollPosition = getDashboardScrollPosition();
    const workspace = getWorkspace();
    const accessLevel = getAccessLevel();
    const projects = workspace?.projects ?? [];
    const numOfAnalyses = workspace?.numOfAnalyses ?? 0;
    const projectMap = Object.fromEntries(projects.map(p => [p.packageName, p]));
    const tags = getTags();
    const coreTag = useMemo(() => getCoreTag(tags), [tags]);
    const nonCoreTag = getNonCoreTag(coreTag);
    const allTags = [...tags, nonCoreTag, RESERVED_TAGS.UNTAGGED];
    const [mainChartComparedTag, setMainChartComparedTag] = useState<Tag>(nonCoreTag);
    const reservedTagSlugs = Object.values(RESERVED_TAGS).map(({ slug }) => slug);
    const userDefinedTags = useMemo(() => tags.filter(({ slug }) => !reservedTagSlugs.includes(slug)), [tags]);
    const hasUserDefinedTags = userDefinedTags.length > 0;
    const dashboardSections = useMemo(() => getDashboardSections(hasUserDefinedTags), [hasUserDefinedTags]);
    const [loadedCharts, setLoadedCharts] = useState(
        Object.fromEntries(
            dashboardSections.filter(({ charts }) => charts !== undefined)
                .flatMap(({ charts }) => charts!.map(chart => [chart, false]))
        )
    );
    const [loadedTables, setLoadedTables] = useState(
        Object.fromEntries(
            dashboardSections.filter(({ tables }) => tables !== undefined)
                .flatMap(({ tables }) => tables!.map(table => [table, false]))
        )
    );

    const predefinedCharts = useMemo(() => getPredefinedCharts(coreTag, hasUserDefinedTags), [coreTag, hasUserDefinedTags]);
    const predefinedTables = useMemo(() => getPredefinedTables(coreTag), [coreTag]);

    function handleChartLoad(chartType: PredefinedChartType) {
        setLoadedCharts(charts => ({ ...charts, [chartType]: true }));
    }

    function handleTableLoad(tableType: PredefinedTableType) {
        setLoadedTables(tables => ({ ...tables, [tableType]: true }));
    }

    useEffect(() => {
        return () => {
            setDashboardScrollPosition(scrollPositionRef.current);
        };
    }, []);

    useEffect(() => {
        if (!areAllLoaded(loadedCharts) || !areAllLoaded(loadedTables) || !mainRef.current || !initialScrollPosition) {
            return;
        }
        mainRef.current.scrollTop = initialScrollPosition;

        if (mainRef.current.scrollTop === initialScrollPosition) {
            setDashboardScrollPosition(undefined);
        }
    }, [loadedCharts, loadedTables, initialScrollPosition]);

    useLayoutEffect(() => {
        const dashboardURL = generatePath(RoutePath.Dashboard, { workspaceSlug: workspaceSlug! });
        setAnalyticsURL(dashboardURL);
        setDashboardURL(dashboardURL);
    }, []);

    function handleScroll() {
        scrollPositionRef.current = mainRef.current!.scrollTop;
    }

    function renderComponentAdoptionOverTimeDescription() {
        return (
            <>
                Change in
                {" "}
                <StrongTextWithTooltip text={coreTag.name} tooltip={RESERVED_TAGS.CORE.tooltip}/>
                {" "}
                vs.
                {" "}
                <DropdownTags
                    workspaceSlug={workspaceSlug!}
                    tags={tags}
                    value={mainChartComparedTag}
                    linksDisabled={accessLevel === AccessLevel.Page}
                    onChange={setMainChartComparedTag}/>
                {" "}
                component usage over time
            </>
        );
    }

    return (
        <main ref={mainRef} className={classes.popularCharts} onScroll={handleScroll}>
            <MainChart/>
            <div className={classNames(classes.sections, { [classes.hidden]: !areAllLoaded(loadedCharts) || !areAllLoaded(loadedTables) })}>
                {dashboardSections.map((section, index) => {
                    const charts = section.charts?.map(chart => predefinedCharts.find(({ chartType }) => chartType === chart)!);
                    const tables = section.tables?.map(table => predefinedTables.find(({ tableType }) => tableType === table)!);

                    return (
                        <Fragment key={`dashboard-section-${index}`}>
                            <DashboardSection
                                header={
                                    <DashboardSectionHeader
                                        title={section.title}
                                        description={section.description}
                                        rightContent={
                                            section.youtubeVideoId && <PlayButton onClick={() => setYoutubeVideoId(section.youtubeVideoId!)}/>
                                        }/>
                                }>
                                {
                                    charts?.map(chartParams => {
                                        const description = chartParams.chartType === PredefinedChartType.ComponentAdoptionOverTime
                                            ? renderComponentAdoptionOverTimeDescription()
                                            : chartParams.description;

                                        return (
                                            <PopularDashboardChart
                                                key={chartParams.chartType}
                                                workspaceSlug={workspaceSlug!}
                                                numOfAnalyses={numOfAnalyses}
                                                tags={allTags}
                                                projectMap={projectMap}
                                                chartType={chartParams.chartType}
                                                title={chartParams.title}
                                                description={description}
                                                analysisType={chartParams.analysisType}
                                                analysisSubject={chartParams.analysisSubject}
                                                filters={chartParams.filters}
                                                nonCoreFilters={chartParams.nonCoreFilters}
                                                fallbacks={chartParams.fallbacks}
                                                breakdownType={chartParams.breakdownType}
                                                emptyStateMessage={chartParams.emptyStateMessage}
                                                linksDisabled={accessLevel === AccessLevel.Page}
                                                readOnly={accessLevel === AccessLevel.ReadOnly}
                                                onLoad={handleChartLoad}/>
                                        );
                                    })
                                }
                                {
                                    tables?.map(tableParams =>
                                        <DashboardTable
                                            key={tableParams.tableType}
                                            workspace={workspace!}
                                            linksDisabled={accessLevel === AccessLevel.Page}
                                            onLoad={handleTableLoad}
                                            {...tableParams}/>
                                    )
                                }
                            </DashboardSection>
                            {index !== dashboardSections.length - 1 && <DashboardSection.Separator/>}
                        </Fragment>
                    );
                })}
            </div>
            {youtubeVideoId && (
                <YoutubePlayer
                    videoId={youtubeVideoId}
                    onClose={() => setYoutubeVideoId(null)}/>
            )}
        </main>
    );
}

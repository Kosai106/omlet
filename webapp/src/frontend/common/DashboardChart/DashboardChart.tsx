import { type ReactNode, useState, useRef } from "react";

import classNames from "classnames";
import { Link } from "react-router-dom";

import { AnalysisSubject } from "../../../common/models/AnalysisSubject";
import { AnalysisType } from "../../../common/models/AnalysisType";
import { BreakdownType } from "../../../common/models/BreakdownType";
import { type ChartDatum } from "../../../common/models/ChartDatum";
import { type Project } from "../../../common/models/Project";
import { type Tag } from "../../../common/models/Tag";
import { type TimeSeriesFilter } from "../../../common/models/TimeSeriesFilter";
import { config } from "../../../config/frontend";
import { getSharedPage } from "../../api/api";
import { ContextMenu, MenuAlignment } from "../../library/ContextMenu/ContextMenu";
import { H2 } from "../../library/Heading/Heading";
import { IconArrow } from "../../library/icons/IconArrow";
import { IconMenu } from "../../library/icons/IconMenu";
import { Loading } from "../../library/Loading/Loading";
import { useToast } from "../../library/Toast/Toast";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { SingleDataAreaChart } from "../chart/areaChart/SingleDataAreaChart";
import { BarChart } from "../chart/barChart/BarChart";
import { ChartMode } from "../chart/barChart/ChartMode";
import { ChartType } from "../chart/ChartType";
import { LineAreaChart } from "../chart/lineAreaChart/LineAreaChart";
import { LineChart } from "../chart/lineChart/LineChart";
import { SingleDataLineChart } from "../chart/lineChart/SingleDataLineChart";
import { getLegendItems } from "../chart/utils";
import { EmptyBlock } from "../EmptyBlock/EmptyBlock";

import classes from "./DashboardChart.module.css";

interface Props {
    workspaceSlug: string;
    numOfAnalyses: number;
    data?: ChartDatum[];
    projectMap: Record<string, Project>;
    tagMap: Record<string, Tag>;
    title: string;
    description: ReactNode;
    analysisType: AnalysisType;
    analysisSubject: AnalysisSubject;
    breakdownType?: BreakdownType;
    timeSeriesFilter?: TimeSeriesFilter;
    link: string;
    linksDisabled: boolean;
    readOnly: boolean;
    contextMenuItems: ReactNode;
    emptyStateMessage: ReactNode;
    insight?: ReactNode;
    renderSaveChartPopover(anchor: HTMLElement | null): ReactNode;
}

const LATEST_DATA_ITEM_LIMIT = 7;

export function DashboardChart({
    workspaceSlug,
    numOfAnalyses,
    data,
    tagMap,
    projectMap,
    title,
    description,
    analysisType,
    analysisSubject,
    breakdownType,
    link,
    linksDisabled,
    readOnly,
    contextMenuItems,
    emptyStateMessage,
    insight,
    timeSeriesFilter,
    renderSaveChartPopover,
}: Props) {
    const toast = useToast();

    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false);

    const { actions: { openRenameProjectsDialog } } = useStore();

    async function handleCopyMenuItemClick() {
        const chartURL = new URL(link, config.APP_BASE_URL);

        try {
            const sharedPage = await getSharedPage(workspaceSlug, chartURL.toString());

            if (sharedPage) {
                chartURL.searchParams.set("token", sharedPage.code);
            } else {
                chartURL.searchParams.delete("token");
            }
        } catch {
            chartURL.searchParams.delete("token");
        }

        window.navigator.clipboard.writeText(chartURL.toString());
        toast.show("Link copied to clipboard!");
    }

    function renderHeader() {
        const clss = classNames(classes.header, {
            [classes.menuOpen]: contextMenuOpen || savedChartPopover,
            [classes.linksDisabled]: linksDisabled,
        });

        if (linksDisabled) {
            return (
                <header className={clss}>
                    <div className={classes.content}>
                        <div className={classes.link}>
                            <div className={classes.info}>
                                <H2 className={classes.title}>{title}</H2>
                            </div>
                            <IconArrow className={classes.icon}/>
                        </div>
                        <p className={classes.description}>{description || "No description yet"}</p>
                    </div>
                </header>
            );
        }

        return (
            <header className={clss}>
                <div className={classes.content}>
                    <Link className={classes.link} to={link}>
                        <div className={classes.info}>
                            <H2 className={classes.title}>{title}</H2>
                        </div>
                        <IconArrow className={classes.icon}/>
                    </Link>
                    <p className={classes.description}>{description || "No description yet"}</p>
                </div>
                <button
                    ref={menuButtonRef}
                    className={classNames(classes.menuButton, { [classes.menuOpen]: contextMenuOpen || savedChartPopover })}
                    onClick={() => setContextMenuOpen(true)}>
                    <IconMenu/>
                </button>
            </header>
        );
    }

    function renderChart() {
        if (data === undefined) {
            return <Loading className={classes.loading}/>;
        }

        if (data.length === 0) {
            return <EmptyBlock message={emptyStateMessage}/>;
        }

        if (analysisType === AnalysisType.DataOverTime) {
            const legendItems = getLegendItems(data, projectMap, tagMap, analysisType, analysisSubject, breakdownType);

            if (analysisSubject === AnalysisSubject.Tags && legendItems.length > 1) {
                if (numOfAnalyses === 1 && data.length === 1) {
                    const onlyData = data[0];

                    if (onlyData.values.length === 1) {
                        return (
                            <SingleDataLineChart
                                type={ChartType.Small}
                                margin={{ top: 5, right: 21, bottom: 32, left: 48 }}
                                className={classNames(classes.chart, classes.lineChart)}
                                tagMap={tagMap}
                                data={onlyData}/>
                        );
                    } else if (onlyData.values.length === 2) {
                        return (
                            <SingleDataAreaChart
                                className={classNames(classes.chart, classes.areaChart)}
                                margin={{ top: 5, right: 21, bottom: 48, left: 49 }}
                                data={onlyData}/>
                        );
                    }
                }

                return (
                    <LineAreaChart
                        className={classNames(classes.chart, classes.lineChart)}
                        data={data}
                        tagMap={tagMap}
                        legendItems={legendItems}
                        timeSeriesFilter={timeSeriesFilter}
                        margin={{ top: 5, right: 21, bottom: 48, left: 49 }}/>
                );
            }

            if (numOfAnalyses === 1 && data.length === 1) {
                return (
                    <SingleDataLineChart
                        type={ChartType.Small}
                        margin={{ top: 5, right: 21, bottom: 32, left: 48 }}
                        className={classNames(classes.chart, classes.lineChart)}
                        tagMap={tagMap}
                        data={data[0]}/>
                );
            }

            return (
                <LineChart
                    className={classNames(classes.chart, classes.lineChart)}
                    type={ChartType.Small}
                    data={data}
                    tagMap={tagMap}
                    timeSeriesFilter={timeSeriesFilter}
                    margin={{ top: 5, right: 21, bottom: 32, left: 48 }}
                    axisBottomTickPadding={16}
                    axisBottomTickSize={0}
                    axisBottomItemCountHint={6}/>
            );
        }

        let chartMode;
        if (!breakdownType) {
            chartMode = ChartMode.Absolute;
        } else if (analysisSubject === AnalysisSubject.Components && breakdownType === BreakdownType.ProjectUsedIn) {
            chartMode = ChartMode.Unique;
        } else {
            chartMode = ChartMode.Percentage;
        }

        const limitedData = data.slice(0, LATEST_DATA_ITEM_LIMIT);
        const legendItems = getLegendItems(limitedData, projectMap, tagMap, analysisType, analysisSubject, breakdownType);

        return (
            <BarChart
                className={classNames(classes.chart, classes.barChart)}
                type={ChartType.Small}
                mode={chartMode}
                data={limitedData}
                tagMap={tagMap}
                legendItems={legendItems}
                hasBreakdown={breakdownType !== undefined}
                linksDisabled={linksDisabled}
                displayTooltip/>
        );
    }

    function renderContextMenu() {
        if (!contextMenuOpen) {
            return null;
        }

        return (
            <ContextMenu
                anchorRect={menuButtonRef.current!.getBoundingClientRect()}
                alignment={MenuAlignment.Right}
                offsetY={5}
                onClose={() => setContextMenuOpen(false)}>
                <ContextMenu.Link to={link}>
                    View details
                </ContextMenu.Link>
                <ContextMenu.Button onClick={handleCopyMenuItemClick}>
                    Copy link
                </ContextMenu.Button>
                {!readOnly && analysisSubject === AnalysisSubject.Projects && (
                    <ContextMenu.Button onClick={openRenameProjectsDialog}>
                        Rename projects
                    </ContextMenu.Button>
                )}
                {contextMenuItems}
            </ContextMenu>
        );
    }

    const savedChartPopover = renderSaveChartPopover(menuButtonRef.current);

    return (
        <div className={classes.dashboardChart}>
            {renderHeader()}
            {renderChart()}
            {insight}
            {renderContextMenu()}
            {savedChartPopover}
        </div>
    );
}

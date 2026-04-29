import { Fragment, useEffect, useMemo, useRef } from "react";

import classNames from "classnames";

import { arrayGroup } from "../../../../common/utils";
import { IconElbow } from "../../../library/icons/IconElbow";
import { IconTrash } from "../../../library/icons/IconTrash";
import { Tooltip } from "../../../library/Tooltip/Tooltip";
import { type Analysis } from "../../../models/Analysis";
import { formatDate } from "../../../utils";

import { AnalysesLoading } from "./AnalysesLoading";

import classes from "./Analyses.module.css";

type AnalysisWithPreviousCreatedAt = Analysis & { previousCreatedAt?: Date; };

function getDay(maybeDate: string | number | Date): string {
    const date = new Date(maybeDate);
    const today = new Date();

    if (today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
        if (today.getDate() === date.getDate()) {
            return "Today";
        }

        if (today.getDate() - date.getDate() === 1) {
            return "Yesterday";
        }
    }

    return formatDate(date, { month: "long", day: "numeric" });
}

function getComponentDiff(componentCounts: Analysis["componentCounts"]): string {
    const counts = [];
    if (componentCounts.added) {
        counts.push([componentCounts.added, "added"]);
    }

    if (componentCounts.updated) {
        counts.push([componentCounts.updated, "updated"]);
    }

    if (componentCounts.deleted) {
        counts.push([componentCounts.deleted, "deleted"]);
    }

    if (counts.length === 0) {
        return "No change";
    }

    counts[0].splice(1, 0, "components");

    return counts.map(count => count.join(" ")).join(", ");
}

const projectsCtx = document.createElement("canvas").getContext("2d")!;
projectsCtx.font = "13px Inter";
const PROJECTS_WIDTH = 272;

function getProjectsCellText(projects: string[]): string {
    const visibleProjects = [...projects];

    let cellText;
    do {
        cellText = visibleProjects.join(", ");
        if (projects.length > visibleProjects.length) {
            cellText += `, +${projects.length - visibleProjects.length}`;
        }

        if (projectsCtx.measureText(cellText).width <= PROJECTS_WIDTH) {
            return cellText;
        }

        visibleProjects.pop();
    } while (visibleProjects.length > 0);

    return cellText;
}

interface ItemProps extends Analysis {
    readOnly: boolean;
    isRemoving: boolean;
    analysisInProgress?: boolean;
    onDelete(id: string): void;
}

function AnalysisItem({
    id,
    createdAt,
    packageNames,
    componentCounts,
    createdBy,
    cliVersion,
    readOnly,
    onDelete,
    isRemoving,
    analysisInProgress,
}: ItemProps) {
    const created = new Date(createdAt);
    const diff = analysisInProgress ? "Analysis in progress…" : getComponentDiff(componentCounts);

    return (
        <div className={classNames(classes.analysisItem, { [classes.readOnly]: readOnly })}>
            {!readOnly && (
                <div className={classes.deleteButtonWrapper}>
                    <button
                        className={classes.deleteButton}
                        onClick={() => onDelete(id)}
                        disabled={isRemoving}>
                        <div className={classes.iconWrapper}>
                            <IconTrash/>
                        </div>
                    </button>
                </div>
            )}
            <div className={classes.analysisDate}>
                <IconElbow/>
                <time dateTime={created.toString()} title={created.toString()}>
                    {formatDate(created, { timeStyle: "short" })}
                </time>
            </div>
            <div className={classes.projects}>
                <Tooltip content={packageNames.join("\n")}>
                    {getProjectsCellText(packageNames)}
                </Tooltip>
            </div>
            <div className={classes.diff} title={diff}>{diff}</div>
            <div className={classes.scanner} title={createdBy.email}>{createdBy.fullName ?? createdBy.email}</div>
            <div className={classes.cliVersion} title={cliVersion}>CLI v{cliVersion}</div>
        </div>
    );
}

interface Props {
    analyses: Analysis[];
    hasNextPage: boolean;
    readOnly: boolean;
    isRemoving: boolean;
    isFetchingNextPage: boolean;
    analysisInProgress?: boolean;
    onEnd(): void;
    onDelete(id: string): void;
}

export function Analyses({
    analyses,
    hasNextPage,
    readOnly,
    analysisInProgress,
    isRemoving,
    isFetchingNextPage,
    onEnd,
    onDelete,
}: Props) {
    const analysesRef = useRef<HTMLDivElement>(null);
    const intersectionObserveeRef = useRef<HTMLDivElement>(null);
    const intersectionObserverRef = useRef<IntersectionObserver>();

    useEffect(() => {
        if (intersectionObserveeRef.current && hasNextPage) {
            intersectionObserverRef.current = new IntersectionObserver(entries => {
                const isIntersecting = entries.some(({ isIntersecting }) => isIntersecting);
                if (isIntersecting) {
                    onEnd();
                }
            });

            intersectionObserverRef.current.observe(intersectionObserveeRef.current);
        } else {
            intersectionObserverRef.current?.disconnect();
        }

        return () => {
            intersectionObserverRef.current?.disconnect();
        };
    }, [analyses]);


    const monthlyAndDailyAnalyses = useMemo(() => {
        const analysesWithPreviousCreatedAt: AnalysisWithPreviousCreatedAt[] = analyses.map((analysis, index) => ({
            ...analysis,
            previousCreatedAt: index === analyses.length - 1 ? undefined : analyses[index + 1].createdAt,
        }));

        const monthlyAnalyses = Object.entries(arrayGroup(analysesWithPreviousCreatedAt, ({ createdAt }) => formatDate(createdAt, { month: "long", year: "numeric" })));
        return monthlyAnalyses.map<[string, [string, AnalysisWithPreviousCreatedAt[]][]]>(([month, scans]) => [month, Object.entries(arrayGroup(scans, ({ createdAt }) => getDay(createdAt)))]);
    }, [analyses]);

    const latestAnalysis = analyses[0];
    return (
        <div className={classes.analyses} ref={analysesRef}>
            {monthlyAndDailyAnalyses.map(([month, dailyAnalyses]) =>
                <section key={`${month}-section`} className={classes.month}>
                    <h2 key={month} className={classes.monthTitle}>{month}</h2>
                    {dailyAnalyses.map(([day, analyses], index) => {
                        return (
                            <Fragment key={`${day}-fragment`}>
                                <section key={`${day}-section`} className={classes.day}>
                                    <h3 key={day} className={classes.dayTitle}>{day}</h3>
                                    {analyses.map(analysis => {
                                        // Only pass analysisInProgress for the latest analysis
                                        const isLatestAnalysis = analysis.id === latestAnalysis?.id;
                                        const showInProgress = isLatestAnalysis && analysisInProgress;

                                        return (
                                            <AnalysisItem
                                                key={`${analysis.id}`}
                                                {...analysis}
                                                readOnly={readOnly}
                                                isRemoving={isRemoving}
                                                analysisInProgress={showInProgress}
                                                onDelete={onDelete}/>
                                        );
                                    })}
                                </section>
                                {index !== dailyAnalyses.length - 1 &&
                                    <hr key={`${day}-separator`} className={classes.separator}/>}
                            </Fragment>
                        );
                    })}
                </section>
            )}
            {isFetchingNextPage && <AnalysesLoading isFetchingNextPage/>}
            <div key="intersectionObservee" ref={intersectionObserveeRef}/>
        </div>
    );
}

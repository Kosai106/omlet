import { Fragment, type UIEvent, useEffect, useMemo, useState } from "react";

import classNames from "classnames";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { type Project } from "../../../../common/models/Project";
import { getLatestAnalysisComponentUsages } from "../../../api/api";
import { IconCancel } from "../../../library/icons/IconCancel";
import { IconCopy } from "../../../library/icons/IconCopy";
import { IconElbow } from "../../../library/icons/IconElbow";
import { Skeleton } from "../../../library/Skeleton/Skeleton";
import { logError } from "../../../logger";
import { type Component } from "../../../models/Component";
import { type ComponentUsage } from "../../../models/ComponentUsage";
import { type PropUsage } from "../../../models/PropUsage";
import { propValueToString } from "../../../models/PropValue";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { getHumanReadableURL, range } from "../../../utils";

import classes from "./PropUsages.module.css";

const BORDER_THRESHOLD = 20;

interface PropUsageProps {
    component: Pick<Component, "name" | "path">;
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
    props: PropUsage[];
}

function UsageRow({ component: { name, path }, start, end, props }: PropUsageProps) {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    function handleCopyClick() {
        navigator.clipboard.writeText(path);

        setIsTooltipVisible(true);
        window.setTimeout(() => {
            setIsTooltipVisible(false);
        }, 1500);
    }
    return (
        <div className={classes.usage}>
            <IconElbow/>
            <div className={classes.componentInfo}>
                <span className={classes.nameAndLine}>
                    {name}
                    {", "}
                    {start.line === end.line ? `Line ${start.line}` : `Lines ${start.line}-${end.line}`}
                </span>
                <span className={classes.at}>
                    {" @ "}
                </span>
                <span className={classes.path}>{path}</span>
                <button
                    className={classes.copyButton}
                    type="button"
                    onClick={handleCopyClick}>
                    <IconCopy/>
                    <div className={classNames(classes.copiedTooltip, { [classes.visible]: isTooltipVisible })}>
                        Copied!
                    </div>
                </button>
            </div>
            <div className={classes.props}>
                {props.map(({ name, value: rawValue }) => {
                    const value = propValueToString(rawValue);
                    return (
                        <div key={name || value} className={classes.prop}>
                            {name && (
                                <>
                                    {name}:
                                    {" "}
                                </>
                            )}
                            <span className={classes.propValue}>{value}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function groupUsages(usages: ComponentUsage[], projects: Project[]): UsageGroup[] {
    const packageMap: Record<string, ComponentUsage[]> = {};
    for (const usage of usages) {
        const packageName = usage.component.packageName;
        if (!(packageName in packageMap)) {
            packageMap[packageName] = [];
        }
        packageMap[packageName].push(usage);
    }
    return Object.entries(packageMap).map(([packageName, usages]) => ({
        packageName,
        repositoryURL: projects.find(project => project.packageName === packageName)?.repository?.url,
        usages,
    }));
}

const NUMBER_OF_SKELETON_CELLS = 4;

interface UsageGroup {
    packageName: string;
    repositoryURL?: string;
    usages: ComponentUsage[];
}

interface TransformedData {
    groupedUsages: UsageGroup[];
}

export function PropUsages() {
    const [showBorder, setShowBorder] = useState(false);

    const [data, setData] = useState<TransformedData | null>(null);
    const { workspaceSlug, componentSlug } = useParams();
    const navigate = useNavigate();
    const [, definitionId] = useMemo(() => componentSlug?.split("::") ?? [], [componentSlug]);
    const { hash } = useLocation();
    const [searchParams] = useSearchParams();
    const propName = searchParams.get("selected_prop")!;
    const propValue = searchParams.get("selected_value") ?? undefined;
    const { selectors: { getWorkspace } } = useStore();
    const workspace = getWorkspace()!;

    useEffect(() => {
        async function fetchUsages() {
            try {
                const { data } = await getLatestAnalysisComponentUsages(workspaceSlug!, encodeURIComponent(definitionId), propName, propValue);
                setData({ groupedUsages: groupUsages(data, workspace.projects) });
            } catch (error) {
                logError(error);
                navigate("..");
            }
        }
        setData(null);
        fetchUsages();
    }, [workspaceSlug, workspace.projects, definitionId, propValue, propName]);

    const closeLink = useMemo(() => {
        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.delete("selected_prop");
        nextSearchParams.delete("selected_value");
        return {
            hash,
            search: `?${nextSearchParams.toString()}`,
        };
    }, [searchParams]);

    function handleScroll(e: UIEvent<HTMLDivElement>) {
        setShowBorder(e.currentTarget.scrollTop > BORDER_THRESHOLD);
    }

    const loading = !data;

    return (
        <div className={classNames(classes.propUsages, { [classes.loading]: loading })} onScroll={handleScroll}>
            <div className={classNames(classes.header, { [classes.withBorder]: showBorder })}>
                <Link to={closeLink} className={classes.closeButton}>
                    <IconCancel/>
                </Link>
                <div>
                    Usages with
                    {" "}
                    <span className={classes.propName}>"{propName}"</span>
                    {" "}
                    prop
                    {propValue && (
                        <>
                            {" "}
                            as
                            {" "}
                            <span className={classes.propName}>{propValue}</span>
                        </>
                    )}
                </div>
            </div>
            <div className={classes.list}>
                {loading
                    ? (
                        <div className={classes.package}>
                            <div className={classes.packageInfo}>
                                <Skeleton className={classes.packageName} />
                                <Skeleton className={classes.repositoryURL} />
                            </div>
                            {[...range(1, NUMBER_OF_SKELETON_CELLS)].map(i => (
                                <Fragment key={i}>
                                    {i > 1 && <div className={classes.separator} />}
                                    <div className={classes.usage}>
                                        <IconElbow/>
                                        <div className={classes.componentInfo}>
                                            <Skeleton />
                                            <Skeleton />
                                        </div>
                                        <Skeleton className={classes.props} />
                                    </div>
                                </Fragment>
                            ))}
                        </div>
                    )
                    : data.groupedUsages.map(({ packageName, repositoryURL, usages }) => (
                        <div className={classes.package} key={packageName}>
                            <div className={classes.packageInfo}>
                                <div className={classes.packageName}>
                                    {packageName}
                                </div>
                                {repositoryURL && (
                                    <a className={classes.repositoryURL} href={repositoryURL} target="_blank">
                                        {getHumanReadableURL(repositoryURL)}
                                    </a>
                                )}
                            </div>
                            {usages.map(({ component, start, end, props }, i) => (
                                <Fragment key={`${component.id}:${start.line}:${start.column}`}>
                                    {i > 0 && <div className={classes.separator} />}
                                    <UsageRow component={component} start={start} end={end} props={props} />
                                </Fragment>
                            ))}
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

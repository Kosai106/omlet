import { type ReactNode, useEffect, useState } from "react";

import classNames from "classnames";
import { Link, generatePath } from "react-router-dom";

import { type Filter } from "../../../../common/models/Filter";
import { RoutePath } from "../../../../common/RoutePath";
import { getLatestAnalysisComponents, getUnusedComponentProps } from "../../../api/api";
import { EmptyBlock } from "../../../common/EmptyBlock/EmptyBlock";
import { H2 } from "../../../library/Heading/Heading";
import { IconArrow } from "../../../library/icons/IconArrow";
import { logError } from "../../../logger";
import { type Component } from "../../../models/Component";
import { type GetLatestAnalysisComponentsParams } from "../../../models/GetLatestAnalysisComponentsParams";
import { type UnusedComponentPropResult } from "../../../models/UnusedComponentPropResult";
import { type Workspace } from "../../../models/Workspace";
import { formatDate } from "../../../utils";
import { apiParamsToURLParams } from "../../components/utils";
import { ComponentCell } from "../componentCell/ComponentCell";
import { ComponentTable } from "../componentTable/ComponentTable";
import { PredefinedTableType } from "../constants";
import { TableInsight } from "../insight/TableInsight";
import { type RowData } from "../paginatedTable/PaginatedTable";
import { PropertyTable } from "../propertyTable/PropertyTable";

import classes from "./DashboardTable.module.css";

const TABLE_ROW_LIMIT = 30;
function optionalDateToString(date?: Date): string {
    return date === undefined
        ? "Over a year"
        : formatDate(date);
}

function transformComponents(workspaceSlug: string, components: Component[]) {
    return components.map(({ packageName, name, definitionId, createdAt, numOfUsages }) => ({
        link: generatePath(RoutePath.ComponentDetail, {
            workspaceSlug,
            componentSlug: encodeURIComponent(`${name}::${definitionId}`),
        }),
        cells: [
            <ComponentCell componentName={name} packageName={packageName}/>,
            optionalDateToString(createdAt),
            numOfUsages,
        ],
    }));
}
function transformUnusedComponentProps(workspaceSlug: string, unusedComponentProps: UnusedComponentPropResult[]) {
    return unusedComponentProps.map(({ sumOfUsages, propName, component: { definitionId, packageName, name } }) => {
        const url = generatePath(RoutePath.ComponentDetail, {
            workspaceSlug,
            componentSlug: encodeURIComponent(`${name}::${definitionId}`),
        });
        return ({
            link: `${url}#props`,
            cells: [
                propName,
                <ComponentCell componentName={name} packageName={packageName}/>,
                `0 of ${sumOfUsages}`,
            ],
        });
    });
}

interface Props {
    workspace: Workspace;
    tableType: PredefinedTableType;
    params?: GetLatestAnalysisComponentsParams;
    filters?: Filter[];
    title: string;
    description: string;
    emptyStateMessage: ReactNode;
    emptyStateKaomoji?: string;
    linksDisabled: boolean;
    onLoad(chartType: PredefinedTableType): void;
}

export function DashboardTable({
    workspace,
    tableType,
    params,
    filters,
    title,
    description,
    emptyStateMessage,
    emptyStateKaomoji,
    linksDisabled,
    onLoad,
}: Props) {
    const [data, setData] = useState<RowData[] | null>(null);
    const [showCompleteListInsight, setShowCompleteListInsight] = useState(false);

    useEffect(() => {
        if (data !== null) {
            onLoad(tableType);
        }

        let abortController: AbortController | undefined;

        async function fetchData() {
            try {
                abortController = new AbortController();

                if (tableType === PredefinedTableType.UnusedComponentProps) {
                    const unusedComponentProps = await getUnusedComponentProps(workspace.slug, { limit: TABLE_ROW_LIMIT + 1 }, abortController.signal);
                    setData(transformUnusedComponentProps(workspace.slug, unusedComponentProps));
                } else if (tableType === PredefinedTableType.LeastUsedCoreComponents) {
                    const { components } = await getLatestAnalysisComponents(workspace.slug, params!, filters, undefined, abortController.signal);
                    const rowData = transformComponents(workspace.slug, components);
                    setData(rowData);
                }

                onLoad(tableType);
            } catch (error) {
                if (!(error instanceof DOMException) || error.name !== "AbortError") {
                    logError(error);
                }
            }

            return [];
        }

        fetchData();

        return () => {
            abortController?.abort();
        };
    }, [workspace, tableType, params, filters]);

    function handlePageChange(page: number, pageSize: number) {
        setShowCompleteListInsight(!linksDisabled && data!.length > TABLE_ROW_LIMIT && page === pageSize);
    }

    function getTableLink() {
        if (linksDisabled) {
            return null;
        }

        switch (tableType) {
            case PredefinedTableType.UnusedComponentProps:
                return null;

            case PredefinedTableType.LeastUsedCoreComponents: {
                const search = apiParamsToURLParams(params!, filters).toString();
                return `${generatePath(RoutePath.Components, { workspaceSlug: workspace.slug })}?${search}`;
            }
        }
    }

    function renderHeader() {
        const tableLink = getTableLink();
        const info = (
            <div className={classes.info}>
                <H2 className={classes.title}>{title}</H2>
                <p className={classes.description}>{description}</p>
            </div>
        );

        if (tableLink === null) {
            return (
                <div className={classes.header}>
                    {info}
                </div>
            );
        }

        return (
            <Link className={classNames(classes.header, classes.link)} to={tableLink}>
                {info}
                <IconArrow className={classes.icon}/>
            </Link>
        );
    }

    function renderTable() {
        if (data === null) {
            return null;
        }

        if (data.length === 0) {
            return <EmptyBlock message={emptyStateMessage} kaomoji={emptyStateKaomoji} />;
        }

        if (tableType === PredefinedTableType.UnusedComponentProps) {
            return (
                <PropertyTable
                    rows={data.slice(0, TABLE_ROW_LIMIT)}
                    linksDisabled={linksDisabled}
                    onPageChange={handlePageChange}/>
            );
        }

        if (tableType === PredefinedTableType.LeastUsedCoreComponents) {
            return (
                <ComponentTable
                    linksDisabled={linksDisabled}
                    rows={data}/>
            );
        }
    }

    return (
        <div className={classes.dashboardTable}>
            {renderHeader()}
            {renderTable()}
            <TableInsight tableType={tableType} data={data} showCompleteListInsight={showCompleteListInsight}/>
        </div>
    );
}

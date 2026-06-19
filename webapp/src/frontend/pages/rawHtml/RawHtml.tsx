import { useEffect, useMemo, useState } from "react";

import { getRawHtmlUsage } from "../../api/api";
import { Button, ButtonKind } from "../../library/Button/Button";
import { H1 } from "../../library/Heading/Heading";
import { IconChevronDown } from "../../library/icons/IconChevronDown";
import { IconChevronUp } from "../../library/icons/IconChevronUp";
import { SearchInput } from "../../library/SearchInput/SearchInput";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { type RawHtmlUsageResult } from "../../models/RawHtmlUsageResult";
import { SortOrder } from "../../models/SortOrder";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { type RowData, PaginatedTable } from "../popularCharts/paginatedTable/PaginatedTable";

import { EditMappingsDialog } from "./editMappingsDialog/EditMappingsDialog";

import classes from "./RawHtml.module.css";

const PAGE_SIZE = 15;
const EXAMPLE_LIMIT = 3;

// Column order must match the `columnClassNames` passed to the table.
enum SortColumn {
    Element = "element",
    Components = "components",
    Projects = "projects",
    Usages = "usages",
}

const sortColumns = [SortColumn.Element, SortColumn.Components, SortColumn.Projects, SortColumn.Usages];

const columnLabels: Record<SortColumn, string> = {
    [SortColumn.Element]: "Element",
    [SortColumn.Components]: "Components",
    [SortColumn.Projects]: "Projects",
    [SortColumn.Usages]: "Uses",
};

function compareRows(a: RawHtmlUsageResult, b: RawHtmlUsageResult, column: SortColumn): number {
    switch (column) {
        case SortColumn.Element:
            return a.element.localeCompare(b.element);
        case SortColumn.Components:
            return a.numComponents - b.numComponents;
        case SortColumn.Projects:
            return a.numProjects - b.numProjects;
        case SortColumn.Usages:
            return a.numUsages - b.numUsages;
    }
}

function SortHeader({ label, active, order, onClick }: { label: string; active: boolean; order: SortOrder; onClick(): void; }) {
    return (
        <button type="button" className={classes.sortHeader} onClick={onClick}>
            {label}
            {active && (
                order === SortOrder.Descending
                    ? <IconChevronDown color="var(--label-secondary-color)"/>
                    : <IconChevronUp color="var(--label-secondary-color)"/>
            )}
        </button>
    );
}

function formatExamples({ components, numComponents }: RawHtmlUsageResult): string {
    const names = components.slice(0, EXAMPLE_LIMIT).map(component => component.name);
    const remaining = numComponents - names.length;
    if (remaining > 0) {
        return `${names.join(", ")} +${remaining} more`;
    }
    return names.join(", ");
}

function transformRows(rows: RawHtmlUsageResult[]): RowData[] {
    return rows.map(row => ({
        link: "",
        cells: [
            <code key="element" className={classes.element}>{`<${row.element}>`}</code>,
            row.numComponents,
            row.numProjects,
            row.numUsages,
            row.suggestedReplacement ?? "",
            formatExamples(row),
        ],
    }));
}

export function RawHtml() {
    const { selectors: { getWorkspace, getAccessLevel } } = useStore();
    const workspace = getWorkspace();
    const canEdit = getAccessLevel() === AccessLevel.Full;

    const [usage, setUsage] = useState<RawHtmlUsageResult[] | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortColumn, setSortColumn] = useState(SortColumn.Components);
    const [sortOrder, setSortOrder] = useState(SortOrder.Descending);
    const [reloadKey, setReloadKey] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    function handleSort(column: SortColumn) {
        if (column === sortColumn) {
            setSortOrder(order => order === SortOrder.Descending ? SortOrder.Ascending : SortOrder.Descending);
        } else {
            setSortColumn(column);
            // The element name reads most naturally ascending; the counts descending.
            setSortOrder(column === SortColumn.Element ? SortOrder.Ascending : SortOrder.Descending);
        }
    }

    useEffect(() => {
        if (!workspace) {
            return;
        }

        const abortController = new AbortController();

        async function fetchData() {
            try {
                const result = await getRawHtmlUsage(workspace!.slug, {}, abortController.signal);
                setUsage(result);
                setSearchTerm("");
            } catch (error) {
                if (!(error instanceof DOMException) || error.name !== "AbortError") {
                    logError(error);
                }
            }
        }

        fetchData();

        return () => abortController.abort();
    }, [workspace, reloadKey]);

    const rows = useMemo(() => {
        if (usage === null) {
            return null;
        }

        const search = searchTerm.trim().toLowerCase();
        const filtered = search
            ? usage.filter(({ element }) => element.toLowerCase().includes(search))
            : usage;

        const direction = sortOrder === SortOrder.Ascending ? 1 : -1;
        const sorted = [...filtered].sort((a, b) => direction * compareRows(a, b, sortColumn));

        return transformRows(sorted);
    }, [usage, searchTerm, sortColumn, sortOrder]);

    // Remount the table on any filter or sort change so its internal pagination resets to the first page.
    const filterKey = [searchTerm, `${sortColumn}:${sortOrder}`].join("|");

    const sortableHeaders = sortColumns.map(column => (
        <SortHeader
            key={column}
            label={columnLabels[column]}
            active={sortColumn === column}
            order={sortOrder}
            onClick={() => handleSort(column)}/>
    )).concat(
        <span key="replacement">Suggested replacement</span>,
        <span key="examples">Example components</span>,
    );

    return (
        <main className={classes.rawHtml}>
            <div className={classes.content}>
                <header className={classes.titleBlock}>
                    <H1 className={classes.title}>Raw HTML{rows !== null && ` (${rows.length})`}</H1>
                    <p className={classes.description}>
                        Raw HTML elements rendered directly in component code instead of a design-system
                        component - an adoption-gap backlog. Each row shows how many components and
                        projects render that element.
                    </p>
                </header>
                <div className={classes.activeFilters}>
                    <SearchInput
                        className={classes.search}
                        placeholder="Search elements"
                        value={searchTerm}
                        onSearch={setSearchTerm}/>
                    {canEdit && usage !== null && usage.length > 0 && (
                        <Button className={classes.editButton} kind={ButtonKind.Secondary} onClick={() => setIsDialogOpen(true)}>
                            Edit replacements
                        </Button>
                    )}
                </div>
                {rows !== null && rows.length === 0 && (
                    <p className={classes.empty}>No raw HTML elements found in the latest scan.</p>
                )}
                {rows !== null && rows.length > 0 && (
                    <PaginatedTable
                        key={filterKey}
                        rowClassName={classes.row}
                        columnClassNames={[classes.elementColumn, classes.componentsColumn, classes.projectsColumn, classes.usesColumn, classes.replacementColumn, classes.examplesColumn]}
                        headers={sortableHeaders}
                        rows={rows}
                        pageSize={PAGE_SIZE}
                        linksDisabled/>
                )}
            </div>
            {isDialogOpen && usage !== null && (
                <EditMappingsDialog
                    elements={usage.map(({ element }) => element)}
                    onClose={() => setIsDialogOpen(false)}
                    onSaved={() => setReloadKey(key => key + 1)}/>
            )}
        </main>
    );
}

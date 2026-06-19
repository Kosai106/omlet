import { useEffect, useMemo, useState } from "react";

import classNames from "classnames";
import { generatePath, useSearchParams } from "react-router-dom";

import {
    type NumberFilterOperation,
    type StringFilterOperation,
    FilterOperation,
} from "../../../common/models/FilterOperation";
import { RoutePath } from "../../../common/RoutePath";
import { getComponentPropsUsage } from "../../api/api";
import { Dropdown } from "../../library/Dropdown/Dropdown";
import { type DropdownOption } from "../../library/Dropdown/DropdownOption";
import { FilterPill } from "../../library/FilterPill/FilterPill";
import { H1 } from "../../library/Heading/Heading";
import { IconChevronDown } from "../../library/icons/IconChevronDown";
import { IconChevronUp } from "../../library/icons/IconChevronUp";
import { PopoverDirection } from "../../library/Popover/Popover";
import { SearchInput } from "../../library/SearchInput/SearchInput";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { type ComponentPropUsageResult } from "../../models/ComponentPropUsageResult";
import { SortOrder } from "../../models/SortOrder";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { isValidRegex } from "../../utils";
import { DropdownNumber } from "../components/dropdownNumber/DropdownNumber";
import { DropdownString } from "../components/dropdownString/DropdownString";
import { type RowData, PaginatedTable } from "../popularCharts/paginatedTable/PaginatedTable";

import classes from "./Props.module.css";

const PAGE_SIZE = 15;
const ALL_PROJECTS = "__all_projects__";

// Column order must match the `columnClassNames` passed to the table.
enum SortColumn {
    Prop = "prop",
    Component = "component",
    Project = "project",
    Used = "used",
}

const sortColumns = [SortColumn.Prop, SortColumn.Component, SortColumn.Project, SortColumn.Used];

const columnLabels: Record<SortColumn, string> = {
    [SortColumn.Prop]: "Prop",
    [SortColumn.Component]: "Component",
    [SortColumn.Project]: "Project",
    [SortColumn.Used]: "Used",
};

function compareProps(a: ComponentPropUsageResult, b: ComponentPropUsageResult, column: SortColumn): number {
    switch (column) {
        case SortColumn.Prop:
            return a.propName.localeCompare(b.propName);
        case SortColumn.Component:
            return a.component.name.localeCompare(b.component.name);
        case SortColumn.Project:
            return a.component.packageName.localeCompare(b.component.packageName);
        case SortColumn.Used:
            return (a.numberOfUsages - b.numberOfUsages) || (a.sumOfUsages - b.sumOfUsages);
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

enum Usage {
    All = "all",
    Unused = "unused",
    Used = "used",
}

const usageOptions: DropdownOption<Usage>[] = [
    { value: Usage.All, label: "All props" },
    { value: Usage.Unused, label: "Unused only" },
    { value: Usage.Used, label: "Used only" },
];

// Filters that follow the Components-page "Filter by" add/remove model.
enum PropFilter {
    PropName = "propName",
    Component = "component",
    ComponentUsages = "componentUsages",
}

const propFilterLabels: Record<PropFilter, string> = {
    [PropFilter.PropName]: "Prop name",
    [PropFilter.Component]: "Component",
    [PropFilter.ComponentUsages]: "Component usages",
};

interface StringFilter {
    operation: StringFilterOperation;
    value: string;
}

interface NumberFilter {
    operation: NumberFilterOperation;
    value: number | undefined;
}

const EMPTY_STRING_FILTER: StringFilter = { operation: FilterOperation.Contains, value: "" };
const EMPTY_NUMBER_FILTER: NumberFilter = { operation: FilterOperation.GreaterThan, value: undefined };

function matchesString(value: string, { operation, value: query }: StringFilter): boolean {
    const haystack = value.toLowerCase();
    const needle = query.toLowerCase();

    switch (operation) {
        case FilterOperation.Contains:
            return haystack.includes(needle);
        case FilterOperation.DoesNotContain:
            return !haystack.includes(needle);
        case FilterOperation.StartsWith:
            return haystack.startsWith(needle);
        case FilterOperation.DoesNotStartWith:
            return !haystack.startsWith(needle);
        case FilterOperation.EndsWith:
            return haystack.endsWith(needle);
        case FilterOperation.DoesNotEndWith:
            return !haystack.endsWith(needle);
        case FilterOperation.Regex:
            // Don't filter anything out while the regex is still invalid.
            return !isValidRegex(query) || new RegExp(query, "i").test(value);
    }
}

function matchesNumber(value: number, { operation, value: target }: NumberFilter): boolean {
    switch (operation) {
        case FilterOperation.GreaterThan:
            return value > target!;
        case FilterOperation.LessThan:
            return value < target!;
        case FilterOperation.Equals:
            return value === target;
    }
}

function transformProps(workspaceSlug: string, props: ComponentPropUsageResult[]): RowData[] {
    return props.map(({ propName, numberOfUsages, sumOfUsages, component: { definitionId, packageName, name } }) => {
        const url = generatePath(RoutePath.ComponentDetail, {
            workspaceSlug,
            componentSlug: encodeURIComponent(`${name}::${definitionId}`),
        });
        return {
            link: `${url}#props`,
            cells: [
                propName,
                name,
                packageName,
                `${numberOfUsages} of ${sumOfUsages}`,
            ],
        };
    });
}

export function Props() {
    const { selectors: { getWorkspace, getAccessLevel } } = useStore();
    const workspace = getWorkspace();
    const accessLevel = getAccessLevel();
    const linksDisabled = accessLevel === AccessLevel.Page;

    const [searchParams] = useSearchParams();

    const [props, setProps] = useState<ComponentPropUsageResult[] | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [usage, setUsage] = useState(() => {
        const param = searchParams.get("usage");
        if (param === Usage.Unused) {
            return Usage.Unused;
        }
        if (param === Usage.Used) {
            return Usage.Used;
        }
        return Usage.All;
    });
    const [selectedProject, setSelectedProject] = useState(ALL_PROJECTS);
    const [propNameFilter, setPropNameFilter] = useState<StringFilter>(EMPTY_STRING_FILTER);
    const [componentNameFilter, setComponentNameFilter] = useState<StringFilter>(EMPTY_STRING_FILTER);
    const [componentUsagesFilter, setComponentUsagesFilter] = useState<NumberFilter>(EMPTY_NUMBER_FILTER);
    const [addedFilter, setAddedFilter] = useState<PropFilter | null>(null);
    const [sortColumn, setSortColumn] = useState(SortColumn.Used);
    const [sortOrder, setSortOrder] = useState(SortOrder.Descending);

    function handleSort(column: SortColumn) {
        if (column === sortColumn) {
            setSortOrder(order => order === SortOrder.Descending ? SortOrder.Ascending : SortOrder.Descending);
        } else {
            setSortColumn(column);
            // Text columns read most naturally ascending; the usage count descending.
            setSortOrder(column === SortColumn.Used ? SortOrder.Descending : SortOrder.Ascending);
        }
    }

    useEffect(() => {
        if (!workspace) {
            return;
        }

        const abortController = new AbortController();

        async function fetchData() {
            try {
                const result = await getComponentPropsUsage(workspace!.slug, {}, abortController.signal);
                setProps(result);
                setSearchTerm("");
                setSelectedProject(ALL_PROJECTS);
                setPropNameFilter(EMPTY_STRING_FILTER);
                setComponentNameFilter(EMPTY_STRING_FILTER);
                setComponentUsagesFilter(EMPTY_NUMBER_FILTER);
                setAddedFilter(null);
            } catch (error) {
                if (!(error instanceof DOMException) || error.name !== "AbortError") {
                    logError(error);
                }
            }
        }

        fetchData();

        return () => abortController.abort();
    }, [workspace]);

    const projectOptions = useMemo<DropdownOption<string>[]>(() => {
        const projects = [...new Set((props ?? []).map(({ component }) => component.packageName))].sort();
        return [
            { value: ALL_PROJECTS, label: "All projects" },
            ...projects.map(project => ({ value: project, label: project })),
        ];
    }, [props]);

    const rows = useMemo(() => {
        if (props === null) {
            return null;
        }

        const search = searchTerm.trim().toLowerCase();

        const filtered = props.filter(({ propName, numberOfUsages, sumOfUsages, component }) => {
            if (search && !propName.toLowerCase().includes(search) && !component.name.toLowerCase().includes(search)) {
                return false;
            }
            if (usage === Usage.Unused && numberOfUsages !== 0) {
                return false;
            }
            if (usage === Usage.Used && numberOfUsages === 0) {
                return false;
            }
            if (selectedProject !== ALL_PROJECTS && component.packageName !== selectedProject) {
                return false;
            }
            if (propNameFilter.value && !matchesString(propName, propNameFilter)) {
                return false;
            }
            if (componentNameFilter.value && !matchesString(component.name, componentNameFilter)) {
                return false;
            }
            if (componentUsagesFilter.value !== undefined && !matchesNumber(sumOfUsages, componentUsagesFilter)) {
                return false;
            }
            return true;
        });

        const direction = sortOrder === SortOrder.Ascending ? 1 : -1;
        const sorted = [...filtered].sort((a, b) => direction * compareProps(a, b, sortColumn));

        return transformProps(workspace!.slug, sorted);
    }, [props, searchTerm, usage, selectedProject, propNameFilter, componentNameFilter, componentUsagesFilter, sortColumn, sortOrder, workspace]);

    // Remount the table on any filter or sort change so its internal pagination resets to the first page.
    const filterKey = [
        searchTerm,
        usage,
        selectedProject,
        `${propNameFilter.operation}:${propNameFilter.value}`,
        `${componentNameFilter.operation}:${componentNameFilter.value}`,
        `${componentUsagesFilter.operation}:${componentUsagesFilter.value}`,
        `${sortColumn}:${sortOrder}`,
    ].join("|");

    const sortableHeaders = sortColumns.map(column => (
        <SortHeader
            key={column}
            label={columnLabels[column]}
            active={sortColumn === column}
            order={sortOrder}
            onClick={() => handleSort(column)}/>
    ));

    function isFilterActive(filter: PropFilter): boolean {
        if (addedFilter === filter) {
            return true;
        }
        switch (filter) {
            case PropFilter.PropName:
                return propNameFilter.value !== "";
            case PropFilter.Component:
                return componentNameFilter.value !== "";
            case PropFilter.ComponentUsages:
                return componentUsagesFilter.value !== undefined;
        }
    }

    function renderActiveFilter(filter: PropFilter) {
        switch (filter) {
            case PropFilter.PropName:
                return (
                    <DropdownString
                        key={filter}
                        label={propFilterLabels[filter]}
                        placeholder="Type a prop name"
                        operation={propNameFilter.operation}
                        value={propNameFilter.value}
                        open={addedFilter === filter}
                        onChange={(operation, value) => setPropNameFilter({ operation, value })}
                        onClose={() => setAddedFilter(null)}/>
                );
            case PropFilter.Component:
                return (
                    <DropdownString
                        key={filter}
                        label={propFilterLabels[filter]}
                        placeholder="Type a component name"
                        operation={componentNameFilter.operation}
                        value={componentNameFilter.value}
                        open={addedFilter === filter}
                        onChange={(operation, value) => setComponentNameFilter({ operation, value })}
                        onClose={() => setAddedFilter(null)}/>
                );
            case PropFilter.ComponentUsages:
                return (
                    <DropdownNumber
                        key={filter}
                        label={propFilterLabels[filter]}
                        operation={componentUsagesFilter.operation}
                        value={componentUsagesFilter.value}
                        open={addedFilter === filter}
                        onChange={(operation, value) => setComponentUsagesFilter({ operation, value })}
                        onClose={() => setAddedFilter(null)}/>
                );
        }
    }

    const activeFilters = Object.values(PropFilter).filter(isFilterActive);
    const availableFilters = Object.values(PropFilter).filter(filter => !isFilterActive(filter));

    return (
        <main className={classes.props}>
            <div className={classes.content}>
                <header className={classes.titleBlock}>
                    <H1 className={classes.title}>Component Props{rows !== null && ` (${rows.length})`}</H1>
                    <p className={classes.description}>List of all component props and how often each is used across the codebase</p>
                </header>
                <div className={classes.activeFilters}>
                    <SearchInput
                        className={classes.search}
                        placeholder="Search props"
                        value={searchTerm}
                        onSearch={setSearchTerm}/>
                    <Dropdown
                        className={classes.filter}
                        options={usageOptions}
                        value={usage}
                        optionsDirection={PopoverDirection.BottomLeft}
                        showValueInButton
                        onChange={setUsage}/>
                    <Dropdown
                        className={classes.filter}
                        placeholder="All projects"
                        options={projectOptions}
                        value={selectedProject}
                        optionsDirection={PopoverDirection.BottomLeft}
                        showValueInButton
                        onChange={setSelectedProject}/>
                    {activeFilters.map(renderActiveFilter)}
                </div>
                {availableFilters.length > 0 && (
                    <div className={classes.availableFilters}>
                        <span className={classes.filterBy}>Filter by</span>
                        {availableFilters.map(filter => (
                            <FilterPill key={filter} onClick={() => setAddedFilter(filter)}>
                                {propFilterLabels[filter]}
                            </FilterPill>
                        ))}
                    </div>
                )}
                {rows !== null && (
                    <PaginatedTable
                        key={filterKey}
                        rowClassName={classNames(classes.row, { [classes.linksDisabled]: linksDisabled })}
                        columnClassNames={[classes.propColumn, classes.componentColumn, classes.projectColumn, classes.usedColumn]}
                        headers={sortableHeaders}
                        rows={rows}
                        pageSize={PAGE_SIZE}
                        linksDisabled={linksDisabled}/>
                )}
            </div>
        </main>
    );
}

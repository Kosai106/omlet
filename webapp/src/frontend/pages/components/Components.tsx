import { useEffect, useMemo, useRef, useState } from "react";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import LZString from "lz-string";
import { generatePath, useParams, useSearchParams } from "react-router-dom";

import {
    type CustomPropertyFilter,
    type Filter,
    type RegularFilter,
    areFiltersSameType,
    getCustomFilterFieldName,
    hasSameFilters,
    isFilterComplete,
    valueIntoBoolean,
    valueIntoNumber,
    valueIntoString,
} from "../../../common/models/Filter";
import { FilterDataType } from "../../../common/models/FilterDataType";
import { type NumberFilterOperation, type StringFilterOperation, FilterOperation } from "../../../common/models/FilterOperation";
import {
    type ArrayFilterType,
    type DateFilterType,
    type NumberFilterType,
    type StringFilterType,
    FilterType,
    getFilterTypeLabel,
} from "../../../common/models/FilterType";
import { type FolderFilter, areFoldersEqual, isFolderFilterEmpty, EMPTY_FOLDER_FILTER } from "../../../common/models/FolderFilter";
import { type Tag, RESERVED_TAGS } from "../../../common/models/Tag";
import { TreeNode } from "../../../common/models/TreeNode";
import { RoutePath } from "../../../common/RoutePath";
import { compareProject, compareString } from "../../../common/sortUtils";
import { type PickPartial, type PartialExcept, type Optional } from "../../../common/utilityTypes";
import {
    createWorkspaceTag,
    deleteWorkspaceTag,
    getCustomProperties,
    getLatestAnalysisComponents,
    getLatestAnalysisFolders,
    getWorkspace as getWorkspaceBySlug,
    updateWorkspaceTag,
} from "../../api/api";
import { Button, ButtonKind } from "../../library/Button/Button";
import { FilterPill } from "../../library/FilterPill/FilterPill";
import { IconCheck } from "../../library/icons/IconCheck";
import { IconMetadata } from "../../library/icons/IconMetadata";
import { IconTag } from "../../library/icons/IconTag";
import { SearchInput } from "../../library/SearchInput/SearchInput";
import { useToast } from "../../library/Toast/Toast";
import { Tooltip } from "../../library/Tooltip/Tooltip";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { type ComponentsResponse } from "../../models/ComponentsResponse";
import { type GetLatestAnalysisComponentsParams } from "../../models/GetLatestAnalysisComponentsParams";
import { type Package } from "../../models/Package";
import { SortOrder } from "../../models/SortOrder";
import { SortType } from "../../models/SortType";
import { usePreferencesStore } from "../../providers/PreferencesStoreProvider/PreferencesStoreProvider";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { combineFolders } from "../../treeUtils";
import { getCustomPropertyTypes } from "../../utils";

import { AddCustomPropertyButton } from "./addCustomPropertyButton/AddCustomPropertyButton";
import { ComponentList } from "./componentList/ComponentList";
import { ComponentListHeader } from "./componentListHeader/ComponentListHeader";
import { CreateTagPopover } from "./createTagPopover/CreateTagPopover";
import { DropdownCustomProperty } from "./dropdownCustomProperty/DropdownCustomProperty";
import { DropdownDate } from "./dropdownDate/DropdownDate";
import { DropdownMulti } from "./dropdownMulti/DropdownMulti";
import { DropdownNumber } from "./dropdownNumber/DropdownNumber";
import { DropdownPath } from "./dropdownPath/DropdownPath";
import { DropdownString } from "./dropdownString/DropdownString";
import { DropdownTags } from "./dropdownTags/DropdownTags";
import { SwitchBoolean } from "./switchBoolean/SwitchBoolean";
import { TagList } from "./tagList/TagList";
import {
    API_PARAM_LIMIT,
    API_PARAM_SEARCH_TERM,
    API_PARAM_SORT_ASCENDING,
    API_PARAM_SORT_KEY,
    FILTERS_KEY,
    FOLDERS_KEY,
    SEARCH_TERM_KEY,
    SORT_ORDER_KEY,
    SORT_TYPE_KEY,
    TAG_KEY,
} from "./utils";

import classes from "./Components.module.css";

const LIMIT = 20;
const BORDER_THRESHOLD = 20;

export function Components() {
    const { workspaceSlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const toast = useToast();

    const [addedFilter, setAddedFilter] = useState<FilterType | null>(null);
    const [addedCustomPropertyFilter, setAddedCustomPropertyFilter] = useState<Pick<CustomPropertyFilter, "field" | "dataType"> | null>(null);
    const [createTagPopoverOpen, setCreateTagPopoverOpen] = useState(false);
    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [successfulTagAction, setSuccessfulTagAction] = useState<"create" | "update" | null>(null);

    const mainRef = useRef<HTMLElement>(null);
    const scrollPositionRef = useRef<number>(0);
    const createNewTagButtonRef = useRef<HTMLButtonElement>(null);

    const {
        actions: { setWorkspace, setComponentsURL, setComponentsScrollPosition },
        selectors: { getUser, getTags, getComponentsScrollPosition, getWorkspace, getAccessLevel },
    } = useStore();

    const {
        actions: { hideTagsCallout },
        selectors: { getIsTagsCalloutHidden },
    } = usePreferencesStore();

    const tags = getTags();
    const tagMap = useMemo(() => Object.fromEntries(tags.map(t => [t.slug, t])), [tags]);
    const userTags = useMemo(() => tags.filter(({ slug }) => ![RESERVED_TAGS.EXTERNAL.slug].includes(slug)), [tags]);

    const workspace = getWorkspace();
    const accessLevel = getAccessLevel();
    const projects = workspace?.projects ?? [];
    const initialScrollPosition = getComponentsScrollPosition();
    const [showBorder, setShowBorder] = useState(initialScrollPosition ?? 0 > BORDER_THRESHOLD);

    const selectedTag = searchParams.get(TAG_KEY);

    const searchTermParam = searchParams.get(SEARCH_TERM_KEY);
    const searchTerm = useMemo(() => {
        if (searchTermParam !== null) {
            return searchTermParam;
        }

        if (selectedTag !== null && tagMap[selectedTag] !== undefined) {
            const { searchTerm = "" } = tagMap[selectedTag];

            return searchTerm;
        }

        return "";
    }, [selectedTag, searchTermParam]);


    const sortType = searchParams.get(SORT_TYPE_KEY) as SortType ?? SortType.Usage;
    const sortOrder = searchParams.get(SORT_ORDER_KEY) as SortOrder ?? SortOrder.Descending;

    const filtersParam = searchParams.get(FILTERS_KEY);
    const filters = useMemo(() => {
        if (filtersParam !== null) {
            try {
                return JSON.parse(LZString.decompressFromEncodedURIComponent(filtersParam)) as Filter[];
            } catch {
                return [];
            }
        }

        if (selectedTag !== null && tagMap[selectedTag] !== undefined) {
            const { filters = [] } = tagMap[selectedTag];

            return filters;
        }

        return [];
    }, [selectedTag, filtersParam]);

    const filterMap = useMemo(() =>
        Object.fromEntries<Filter | undefined>(filters.map(filter => [filter.type, filter]))
    , [filters]) as Record<FilterType, Filter | undefined>;

    const foldersParam = searchParams.get(FOLDERS_KEY);
    const folders = useMemo(() => {
        if (foldersParam !== null) {
            try {
                const foldersJSON = JSON.parse(LZString.decompressFromEncodedURIComponent(foldersParam)) as FolderFilter;

                return {
                    selectedTreeNodes: foldersJSON.selectedTreeNodes.map(node => new TreeNode(node)),
                    deselectedTreeNodes: foldersJSON.deselectedTreeNodes.map(node => new TreeNode(node)),
                };
            } catch {
                return EMPTY_FOLDER_FILTER;
            }
        }

        if (selectedTag !== null && tagMap[selectedTag] !== undefined && filterMap[FilterType.FilePath] === undefined) {
            const { selectedTreeNodes = [], deselectedTreeNodes = [] } = tagMap[selectedTag];

            return { selectedTreeNodes, deselectedTreeNodes };
        }

        return EMPTY_FOLDER_FILTER;
    }, [selectedTag, foldersParam]);

    function hasFilter() {
        return searchTerm.trim() !== "" ||
            filters.length !== 0 ||
            !isFolderFilterEmpty(folders);
    }

    function hasSearchParams() {
        return searchParams.get(SEARCH_TERM_KEY) !== null ||
            searchParams.get(FILTERS_KEY) !== null ||
            searchParams.get(FOLDERS_KEY) !== null;
    }

    function hasTagOverrides() {
        return selectedTag !== null && hasSearchParams();
    }

    function getTagActionTooltipContent(type: "create" | "update") {
        if (filterMap[FilterType.Tag] !== undefined) {
            return `Can’t ${type} since the filters include a tag`;
        }

        if (!hasFilter()) {
            return `Can’t ${type} tag with empty filters`;
        }

        return undefined;
    }

    async function fetchWorkspace() {
        try {
            const { workspace: updatedWorkspace, accessLevel } = await getWorkspaceBySlug(workspace!.slug);

            setWorkspace(updatedWorkspace, accessLevel);
        } catch (error) {
            logError(error);
        }
    }

    const { data, fetchNextPage, isFetching, isPending } = useInfiniteQuery({
        queryKey: [
            "components",
            workspace,
            searchTerm.trim(),
            filters,
            folders,
            sortType,
            sortOrder,
        ],
        queryFn: async ({ pageParam }) => {
            const params: GetLatestAnalysisComponentsParams = {
                [API_PARAM_LIMIT]: LIMIT,
                [API_PARAM_SORT_KEY]: sortType,
                [API_PARAM_SORT_ASCENDING]: String(sortOrder === SortOrder.Ascending),
            };

            if (searchTerm.trim()) {
                params[API_PARAM_SEARCH_TERM] = searchTerm.trim().toLowerCase();
            }

            if (pageParam !== undefined) {
                params.next = Number(pageParam);
            }

            try {
                return await getLatestAnalysisComponents(workspaceSlug!, params, filters, folders);
            } catch (error) {
                logError(error);
                throw error;
            }
        },
        initialPageParam: undefined,
        getNextPageParam: ({ next }: ComponentsResponse) => next,
        getPreviousPageParam: ({ prev }: ComponentsResponse) => prev,
    });

    const components = data?.pages.flatMap((page) => page.components) ?? [];
    const componentCount = data?.pages[0].total;

    const { data: customProperties } = useQuery({
        queryKey: ["customProperties", workspace!.slug],
        async queryFn() {
            const customProperties = await getCustomProperties(workspace!.slug);

            return Object.fromEntries(
                Object.entries(customProperties).sort(([k1], [k2]) => compareString(k1, k2))
            );
        },
        enabled: workspace !== null,
    });

    const { data: packages } = useQuery({
        queryKey: ["latestAnalysisFolders", workspace!.slug],
        async queryFn() {
            const folders = await getLatestAnalysisFolders(workspace!.slug);

            folders.packages.sort((a, b) => compareProject(
                { name: a.name, isInternal: true },
                { name: b.name, isInternal: true },
            ));

            return folders.packages.map(pckg => ({
                ...pckg,
                children: pckg.children.map(folder => combineFolders(folder, pckg.name, tags)),
            })) as Package[];
        },
        enabled: workspace !== null,
    });

    function handleScroll() {
        scrollPositionRef.current = mainRef.current!.scrollTop;
        setShowBorder(mainRef.current!.scrollTop > BORDER_THRESHOLD);
    }

    function handleTagsCalloutDismiss() {
        hideTagsCallout(getUser()!.id);
    }

    function handleSelectTag(tagSlug?: string) {
        const newSearchParams = new URLSearchParams(searchParams);

        newSearchParams.delete(SEARCH_TERM_KEY);
        newSearchParams.delete(FOLDERS_KEY);
        newSearchParams.delete(FILTERS_KEY);

        if (tagSlug) {
            newSearchParams.set(TAG_KEY, tagSlug);
        } else {
            newSearchParams.delete(TAG_KEY);
        }

        setComponentsScrollPosition(0);
        setSearchParams(newSearchParams, { replace: true });
        setSuccessfulTagAction(null);
    }

    async function handleRanameTag(tagSlug: string, name: string) {
        try {
            await updateWorkspaceTag(workspace!.slug, tagSlug, { name });
            await fetchWorkspace();
        } catch (error) {
            logError(error);
        }
    }

    async function handleDeleteTag(tag: Tag) {
        if (window.confirm(`Delete “${tag.name}”?`)) {
            try {
                await deleteWorkspaceTag(workspace!.slug, tag.slug);
                await fetchWorkspace();

                if (selectedTag === tag.slug) {
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.delete(TAG_KEY);

                    setComponentsScrollPosition(0);
                    setSearchParams(newSearchParams, { replace: true });
                    setSuccessfulTagAction(null);
                }
            } catch (error) {
                logError(error);
            }
        }
    }

    function updateFiltersParam(searchParams: URLSearchParams, filters: Filter[]) {
        if (filters.length === 0) {
            searchParams.delete(FILTERS_KEY);
        } else {
            searchParams.set(FILTERS_KEY, LZString.compressToEncodedURIComponent(JSON.stringify(filters)));
        }
    }

    function handleFiltersChange(newFilters: Filter[], newFolders?: FolderFilter | null) {
        const newSearchParams = new URLSearchParams(searchParams);

        if (selectedTag !== null) {
            const { filters } = tagMap[selectedTag];

            if (hasSameFilters(filters, newFilters)) {
                newSearchParams.delete(FILTERS_KEY);
            } else {
                newSearchParams.set(FILTERS_KEY, LZString.compressToEncodedURIComponent(JSON.stringify(newFilters)));
            }
        } else {
            updateFiltersParam(newSearchParams, newFilters);
        }

        if (newFolders !== undefined) {
            if (newFolders === null) {
                newSearchParams.delete(FOLDERS_KEY);
            } else {
                newSearchParams.set(FOLDERS_KEY, LZString.compressToEncodedURIComponent(JSON.stringify(newFolders)));
            }
        }

        setComponentsScrollPosition(0);
        setSearchParams(newSearchParams, { replace: true });
        setSuccessfulTagAction(null);
    }

    function getUpdatedFilters(updatedFilter: PickPartial<RegularFilter, "value"> | PickPartial<CustomPropertyFilter, "value">): Filter[] {
        if (updatedFilter.value === undefined) {
            if (updatedFilter.type === FilterType.CustomProperty) {
                return filters.filter(filter => filter.type !== FilterType.CustomProperty || filter.field !== updatedFilter.field);
            } else {
                return filters.filter(({ type }) => type !== updatedFilter.type);
            }
        }

        const completeUpdatedFilter = updatedFilter as Filter;

        const doesFilterExists = filters.some(filter => areFiltersSameType(filter, completeUpdatedFilter));

        if (doesFilterExists) {
            return filters.map(filter => {
                if (!areFiltersSameType(filter, completeUpdatedFilter)) {
                    return filter;
                }

                return completeUpdatedFilter;
            });
        } else {
            return [...filters, completeUpdatedFilter];
        }
    }

    function handleSearch(term: string) {
        const newSearchParams = new URLSearchParams(searchParams);

        if (selectedTag !== null) {
            const { searchTerm } = tagMap[selectedTag];

            if (searchTerm === term) {
                newSearchParams.delete(SEARCH_TERM_KEY);
            } else {
                newSearchParams.set(SEARCH_TERM_KEY, term);
            }
        } else if (term === "") {
            newSearchParams.delete(SEARCH_TERM_KEY);
        } else {
            newSearchParams.set(SEARCH_TERM_KEY, term);
        }

        setComponentsScrollPosition(0);
        setSearchParams(newSearchParams, { replace: true });
        setSuccessfulTagAction(null);
    }

    async function handleCreateTag(name: string) {
        try {
            setIsCreatingTag(true);

            const tags = await createWorkspaceTag(workspaceSlug!, {
                name,
                searchTerm,
                ...folders,
                filters,
            });
            await fetchWorkspace();

            setCreateTagPopoverOpen(false);
            setSuccessfulTagAction("create");
            toast.show("Saved tag succesfully");

            const newSearchParams = new URLSearchParams(searchParams);

            newSearchParams.delete(SEARCH_TERM_KEY);
            newSearchParams.delete(FOLDERS_KEY);
            newSearchParams.delete(FILTERS_KEY);

            newSearchParams.set(TAG_KEY, tags.find(tag => tag.name === name)!.slug);

            setComponentsScrollPosition(0);
            setSearchParams(newSearchParams, { replace: true });
        } catch (error) {
            logError(error);
        } finally {
            setIsCreatingTag(false);
        }
    }

    async function handleUpdateTag() {
        try {
            await updateWorkspaceTag(workspaceSlug!, selectedTag!, {
                searchTerm,
                ...folders,
                filters,
            });
            await fetchWorkspace();

            setSuccessfulTagAction("update");
            toast.show("Updated tag succesfully");

            const newSearchParams = new URLSearchParams(searchParams);

            newSearchParams.delete(SEARCH_TERM_KEY);
            newSearchParams.delete(FOLDERS_KEY);
            newSearchParams.delete(FILTERS_KEY);

            setComponentsScrollPosition(0);
            setSearchParams(newSearchParams, { replace: true });
        } catch (error) {
            logError(error);
        }
    }

    function handleAddFilter(filterType: FilterType) {
        setAddedFilter(filterType);
    }

    function handleCustomPropertySelect({ field, dataType }: Pick<CustomPropertyFilter, "field" | "dataType">) {
        if (dataType === FilterDataType.Boolean) {
            const newFilters = getUpdatedFilters({
                type: FilterType.CustomProperty,
                field: `metadata.${field}`,
                dataType: FilterDataType.Boolean,
                operation: FilterOperation.Equals,
                value: ["true"],
            });

            handleFiltersChange(newFilters);
        } else {
            setAddedCustomPropertyFilter({ field: `metadata.${field}`, dataType });
        }
    }

    function handleArrayFilter(filterType: ArrayFilterType, value: string[]) {
        const newFilters = getUpdatedFilters({
            type: filterType,
            operation: FilterOperation.Equals,
            value: value.length === 0 ? undefined : value,
        });

        handleFiltersChange(newFilters);
    }

    function handleDateFilter(filterType: DateFilterType, value: string | null) {
        const newFilters = getUpdatedFilters({
            type: filterType,
            operation: FilterOperation.Between,
            value: value === null ? undefined : [value, ""],
        });

        handleFiltersChange(newFilters);
    }

    function handleStringFilter(filterType: StringFilterType, operation: FilterOperation, value: string) {
        const newFilters = getUpdatedFilters({
            type: filterType,
            operation,
            value: value === "" ? undefined : [value],
        });

        handleFiltersChange(newFilters);
    }

    function handleNumberFilter(filterType: NumberFilterType, operation: NumberFilterOperation, value: number | undefined) {
        const newFilters = getUpdatedFilters({
            type: filterType,
            operation,
            value: value === undefined ? undefined : [value.toString()],
        });

        handleFiltersChange(newFilters);
    }

    function handleFilePathFilter(operation: StringFilterOperation, value: string) {
        let newFolders: FolderFilter | null | undefined;
        if (selectedTag !== null) {
            const tag = tagMap[selectedTag];

            if (!isFolderFilterEmpty(tag)) {
                newFolders = EMPTY_FOLDER_FILTER;
            } else {
                newFolders = null;
            }
        } else {
            newFolders = null;
        }

        const newFilters = getUpdatedFilters({
            type: FilterType.FilePath,
            operation,
            value: value === "" ? undefined : [value],
        });

        handleFiltersChange(newFilters, newFolders);
    }

    function handleFolderFilter(newFolderFilter: FolderFilter) {
        let newFolders: FolderFilter | null = newFolderFilter;

        if (selectedTag !== null) {
            const tag = tagMap[selectedTag];

            if (areFoldersEqual(tag, newFolderFilter)) {
                newFolders = null;
            }
        } else if (isFolderFilterEmpty(newFolderFilter)) {
            newFolders = null;
        }

        const newFilters = getUpdatedFilters({
            type: FilterType.FilePath,
            operation: FilterOperation.Contains,
            value: undefined,
        });

        handleFiltersChange(newFilters, newFolders);
    }

    function handleCustomPropertyArrayFilter(name: string, value: string[]) {
        const newFilters = getUpdatedFilters({
            type: FilterType.CustomProperty,
            field: name,
            dataType: FilterDataType.String,
            operation: FilterOperation.Equals,
            value: value.length === 0 ? undefined : value,
        });

        handleFiltersChange(newFilters);
    }

    function handleCustomPropertyNumberFilter(name: string, operation: NumberFilterOperation, value: number | undefined) {
        const newFilters = getUpdatedFilters({
            type: FilterType.CustomProperty,
            field: name,
            dataType: FilterDataType.Number,
            operation,
            value: value === undefined ? undefined : [value.toString()],
        });

        handleFiltersChange(newFilters);
    }

    function handleCustomPropertyBooleanFilter(name: string, value: boolean | undefined) {
        const newFilters = getUpdatedFilters({
            type: FilterType.CustomProperty,
            field: name,
            dataType: FilterDataType.Boolean,
            operation: FilterOperation.Equals,
            value: value === undefined ? undefined : [value.toString()],
        });

        handleFiltersChange(newFilters);
    }

    function handleCustomPropertyDateFilter(name: string, value: string | null) {
        const newFilters = getUpdatedFilters({
            type: FilterType.CustomProperty,
            field: name,
            dataType: FilterDataType.Date,
            operation: FilterOperation.Between,
            value: value === null ? undefined : [value, ""],
        });

        handleFiltersChange(newFilters);
    }

    function handleDropdownClose() {
        setAddedFilter(null);
    }

    function handleResetFilters() {
        setSearchParams(new URLSearchParams(), { replace: true });
    }

    function handleEnd() {
        fetchNextPage();
    }

    function handleSort(newSortType: SortType) {
        let newSortOrder: SortOrder;
        if (sortType === newSortType) {
            newSortOrder = sortOrder === SortOrder.Descending ? SortOrder.Ascending : SortOrder.Descending;
        } else {
            newSortOrder = SortOrder.Descending;
        }

        const newSearchParams = new URLSearchParams(searchParams);
        if (newSortType === SortType.Usage) {
            newSearchParams.delete(SORT_TYPE_KEY);
        } else {
            newSearchParams.set(SORT_TYPE_KEY, newSortType);
        }

        if (newSortOrder === SortOrder.Descending) {
            newSearchParams.delete(SORT_ORDER_KEY);
        } else {
            newSearchParams.set(SORT_ORDER_KEY, newSortOrder);
        }

        setComponentsScrollPosition(0);
        setSearchParams(newSearchParams, { replace: true });
    }

    useEffect(() => {
        const pathname = generatePath(RoutePath.Components, { workspaceSlug: workspaceSlug! });
        setComponentsURL(`${pathname}?${searchParams.toString()}`);
    }, [searchParams]);

    useEffect(() => {
        if (components.length === 0) {
            return;
        }

        if (initialScrollPosition !== undefined) {
            mainRef.current!.scrollTop = initialScrollPosition;

            if (mainRef.current!.scrollTop === initialScrollPosition) {
                setComponentsScrollPosition(undefined);
            }
        }
    }, [components, initialScrollPosition]);

    useEffect(() => {
        if (!isFetching) {
            return () => {
                setComponentsScrollPosition(scrollPositionRef.current);
            };
        }
    }, [isFetching]);

    useEffect(() => {
        if (selectedTag !== null && tagMap[selectedTag] === undefined) {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete(TAG_KEY);

            setSearchParams(newSearchParams, { replace: true });
        }
    }, [selectedTag]);

    function renderCustomPropertyFilter(filter: PartialExcept<CustomPropertyFilter, "field" | "dataType">) {
        const label = getCustomFilterFieldName(filter);

        switch (filter.dataType) {
            case FilterDataType.String:
                return (
                    <DropdownMulti
                        key={filter.field}
                        options={customProperties![label].map(value => ({
                            value: value,
                            label: String(value),
                        }))}
                        icon={<IconMetadata/>}
                        label={label}
                        values={filter.value ?? []}
                        open={addedCustomPropertyFilter?.field === filter.field}
                        onChange={values => handleCustomPropertyArrayFilter(filter.field, values as string[])}
                        onClose={() => setAddedCustomPropertyFilter(null)}/>
                );

            case FilterDataType.Number:
                return (
                    <DropdownNumber
                        key={filter.field}
                        icon={<IconMetadata/>}
                        label={label}
                        operation={filter.operation as Optional<NumberFilterOperation>}
                        value={valueIntoNumber(filter.value)}
                        open={addedCustomPropertyFilter?.field === filter.field}
                        onChange={(operation, value) => handleCustomPropertyNumberFilter(filter.field, operation, value)}
                        onClose={() => setAddedCustomPropertyFilter(null)}/>
                );

            case FilterDataType.Boolean:
                return (
                    <SwitchBoolean
                        key={filter.field}
                        icon={<IconMetadata/>}
                        label={label}
                        value={valueIntoBoolean(filter.value)}
                        onChange={value => handleCustomPropertyBooleanFilter(filter.field, value)}/>
                );

            case FilterDataType.Date:
                return (
                    <DropdownDate
                        key={filter.field}
                        icon={<IconMetadata/>}
                        label={label}
                        value={filter.value?.[0] ?? null}
                        open={addedCustomPropertyFilter?.field === filter.field}
                        onChange={value => handleCustomPropertyDateFilter(filter.field, value)}
                        onClose={() => setAddedCustomPropertyFilter(null)}/>
                );
        }
    }

    function renderCustomPropertyFilters() {
        if (customProperties === undefined) {
            return null;
        }

        const customPropertyFilters = filters.filter((filter): filter is CustomPropertyFilter => filter.type === FilterType.CustomProperty);

        const renderedFilters = customPropertyFilters.map(filter => renderCustomPropertyFilter(filter));

        if (addedCustomPropertyFilter !== null) {
            renderedFilters.push(renderCustomPropertyFilter(addedCustomPropertyFilter));
        }

        return renderedFilters;
    }

    function shouldRenderActiveFilter(filterType: FilterType): boolean {
        return addedFilter === filterType ||
            (filterMap[filterType] !== undefined && isFilterComplete(filterMap[filterType]!)) ||
            (filterType === FilterType.FilePath && !isFolderFilterEmpty(folders));
    }

    function renderActiveFilters() {
        return (
            <>
                {shouldRenderActiveFilter(FilterType.Tag) && (
                    <DropdownTags
                        tags={[...tags, RESERVED_TAGS.UNTAGGED]}
                        values={filterMap[FilterType.Tag]?.value ?? []}
                        open={addedFilter === FilterType.Tag}
                        onChange={values => handleArrayFilter(FilterType.Tag, values)}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.Name) && (
                    <DropdownString
                        label={getFilterTypeLabel(FilterType.Name)}
                        operation={filterMap[FilterType.Name]?.operation as Optional<StringFilterOperation>}
                        value={valueIntoString(filterMap[FilterType.Name]?.value)}
                        placeholder="Type a name"
                        open={addedFilter === FilterType.Name}
                        onChange={(operation, value) => handleStringFilter(FilterType.Name, operation, value)}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.FilePath) && packages !== undefined && (
                    <DropdownPath
                        packages={packages}
                        label="Path"
                        folders={folders}
                        operation={filterMap[FilterType.FilePath]?.operation as Optional<StringFilterOperation>}
                        value={valueIntoString(filterMap[FilterType.FilePath]?.value)}
                        placeholder="Type a path"
                        open={addedFilter === FilterType.FilePath}
                        onFilterChange={handleFilePathFilter}
                        onFoldersChange={handleFolderFilter}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.ProjectDefined) && (
                    <DropdownMulti
                        options={projects.map(({ packageName, name, alias }) => ({
                            value: packageName,
                            label: alias ?? name,
                        }))}
                        label={getFilterTypeLabel(FilterType.ProjectDefined)}
                        values={filterMap[FilterType.ProjectDefined]?.value ?? []}
                        open={addedFilter === FilterType.ProjectDefined}
                        onChange={values => handleArrayFilter(FilterType.ProjectDefined, values)}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.ProjectUsedIn) && (
                    <DropdownMulti
                        options={projects.filter(({ isInternal }) => isInternal).map(({ packageName, name, alias }) => ({
                            value: packageName,
                            label: alias && alias !== name ? alias : name,
                        }))}
                        label={getFilterTypeLabel(FilterType.ProjectUsedIn)}
                        values={filterMap[FilterType.ProjectUsedIn]?.value ?? []}
                        open={addedFilter === FilterType.ProjectUsedIn}
                        onChange={values => handleArrayFilter(FilterType.ProjectUsedIn, values)}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.NumberOfUsages) && (
                    <DropdownNumber
                        label="# used"
                        operation={filterMap[FilterType.NumberOfUsages]?.operation as Optional<NumberFilterOperation>}
                        value={valueIntoNumber(filterMap[FilterType.NumberOfUsages]?.value)}
                        open={addedFilter === FilterType.NumberOfUsages}
                        onChange={(operation, value) => handleNumberFilter(FilterType.NumberOfUsages, operation, value)}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.NumberOfDependencies) && (
                    <DropdownNumber
                        label="# of children"
                        operation={filterMap[FilterType.NumberOfDependencies]?.operation as Optional<NumberFilterOperation>}
                        value={valueIntoNumber(filterMap[FilterType.NumberOfDependencies]?.value)}
                        open={addedFilter === FilterType.NumberOfDependencies}
                        onChange={(operation, value) => handleNumberFilter(FilterType.NumberOfDependencies, operation, value)}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.CreatedDate) && (
                    <DropdownDate
                        label={getFilterTypeLabel(FilterType.CreatedDate)}
                        value={valueIntoString(filterMap[FilterType.CreatedDate]?.value) ?? null}
                        open={addedFilter === FilterType.CreatedDate}
                        onChange={value => handleDateFilter(FilterType.CreatedDate, value)}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.LastUpdatedDate) && (
                    <DropdownDate
                        label={getFilterTypeLabel(FilterType.LastUpdatedDate)}
                        value={valueIntoString(filterMap[FilterType.LastUpdatedDate]?.value) ?? null}
                        open={addedFilter === FilterType.LastUpdatedDate}
                        onChange={value => handleDateFilter(FilterType.LastUpdatedDate, value)}
                        onClose={handleDropdownClose}/>
                )}
                {shouldRenderActiveFilter(FilterType.LastUsageChangedDate) && (
                    <DropdownDate
                        label={getFilterTypeLabel(FilterType.LastUsageChangedDate)}
                        value={valueIntoString(filterMap[FilterType.LastUsageChangedDate]?.value) ?? null}
                        open={addedFilter === FilterType.LastUsageChangedDate}
                        onChange={value => handleDateFilter(FilterType.LastUsageChangedDate, value)}
                        onClose={handleDropdownClose}/>
                )}
                {renderCustomPropertyFilters()}
            </>
        );
    }

    function renderAvailableFilters() {
        return (
            <>
                <span className={classes.filterBy}>Filter by</span>
                {!shouldRenderActiveFilter(FilterType.Tag) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.Tag)}>
                        <IconTag/> {getFilterTypeLabel(FilterType.Tag)}
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.Name) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.Name)}>
                        {getFilterTypeLabel(FilterType.Name)}
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.FilePath) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.FilePath)}>
                        Path
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.ProjectDefined) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.ProjectDefined)}>
                        {getFilterTypeLabel(FilterType.ProjectDefined)}
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.ProjectUsedIn) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.ProjectUsedIn)}>
                        {getFilterTypeLabel(FilterType.ProjectUsedIn)}
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.NumberOfUsages) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.NumberOfUsages)}>
                        # used
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.NumberOfDependencies) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.NumberOfDependencies)}>
                        # of children
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.CreatedDate) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.CreatedDate)}>
                        {getFilterTypeLabel(FilterType.CreatedDate)}
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.LastUpdatedDate) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.LastUpdatedDate)}>
                        {getFilterTypeLabel(FilterType.LastUpdatedDate)}
                    </FilterPill>
                )}
                {!shouldRenderActiveFilter(FilterType.LastUsageChangedDate) && (
                    <FilterPill onClick={() => handleAddFilter(FilterType.LastUsageChangedDate)}>
                        {getFilterTypeLabel(FilterType.LastUsageChangedDate)}
                    </FilterPill>
                )}
                {customProperties !== undefined && Object.keys(customProperties).length === 0 && (
                    <AddCustomPropertyButton/>
                )}
            </>
        );
    }

    function renderAvailableCustomFilters() {
        if (customProperties === undefined) {
            return null;
        }

        const customPropertyNames = Object.keys(customProperties);
        if (customPropertyNames.length === 0) {
            return null;
        }

        const addedCustomPropertyFilterNames = filters
            .filter((filter): filter is CustomPropertyFilter => filter.type === FilterType.CustomProperty)
            .map(filter => getCustomFilterFieldName(filter));

        if (addedCustomPropertyFilterNames.length === customPropertyNames.length) {
            return null;
        }

        const remainingCustomPropertyNames = customPropertyNames.filter(name => !addedCustomPropertyFilterNames.includes(name));

        const customPropertyTypes = getCustomPropertyTypes(customProperties);
        const options = remainingCustomPropertyNames.map(customProperty => ({
            label: customProperty,
            value: {
                field: customProperty,
                dataType: customPropertyTypes[customProperty],
            },
        }));

        return (
            <div className={classes.availableFilters}>
                <span className={classes.filterBy}>Filter by</span>
                <DropdownCustomProperty
                    options={options}
                    onSelect={handleCustomPropertySelect}/>
            </div>
        );
    }

    const isTagActionDisabled = filterMap[FilterType.Tag] !== undefined || !hasFilter() || accessLevel === AccessLevel.ReadOnly;

    return (
        <main
            ref={mainRef}
            className={classes.components}
            onScroll={handleScroll}>
            <TagList
                tags={userTags}
                selectedTag={selectedTag !== null ? tagMap[selectedTag] : undefined}
                hasOverrides={hasTagOverrides()}
                isTagsCalloutHidden={getIsTagsCalloutHidden()}
                readOnly={accessLevel === AccessLevel.ReadOnly}
                onTagsCalloutDismiss={handleTagsCalloutDismiss}
                onSelect={handleSelectTag}
                onRename={handleRanameTag}
                onDelete={handleDeleteTag}/>
            <div className={classes.componentList}>
                <div className={classNames(classes.header, { [classes.withBorder]: showBorder })}>
                    <div className={classes.filters}>
                        <div className={classes.activeFilters}>
                            <SearchInput
                                className={classes.search}
                                placeholder="Search for a component"
                                value={searchTerm}
                                onSearch={handleSearch}/>
                            {renderActiveFilters()}
                        </div>
                        <div className={classes.tagActions}>
                            {successfulTagAction && (
                                <Button icon={<IconCheck/>}>
                                    {successfulTagAction === "create" ? "Created" : "Updated"}!
                                </Button>
                            )}
                            {hasSearchParams() && (
                                <Tooltip
                                    content={getTagActionTooltipContent("create")}>
                                    <Button
                                        ref={createNewTagButtonRef}
                                        kind={hasTagOverrides() ? ButtonKind.Secondary : ButtonKind.Primary}
                                        icon={<IconTag/>}
                                        disabled={isTagActionDisabled}
                                        onClick={() => setCreateTagPopoverOpen(true)}>
                                        Create new tag
                                    </Button>
                                </Tooltip>
                            )}
                            {hasTagOverrides() && (
                                <Tooltip
                                    content={getTagActionTooltipContent("update")}>
                                    <Button
                                        icon={<IconTag/>}
                                        disabled={isTagActionDisabled}
                                        onClick={handleUpdateTag}>
                                        Update tag
                                    </Button>
                                </Tooltip>
                            )}
                            {createTagPopoverOpen && (
                                <CreateTagPopover
                                    anchor={createNewTagButtonRef.current!}
                                    tags={userTags}
                                    isCreating={isCreatingTag}
                                    onSubmit={handleCreateTag}
                                    onCancel={() => setCreateTagPopoverOpen(false)}/>
                            )}
                        </div>
                    </div>
                    <div className={classes.availableFilters}>
                        {renderAvailableFilters()}
                    </div>
                    {renderAvailableCustomFilters()}
                    <ComponentListHeader
                        componentCount={hasFilter() ? componentCount : undefined}
                        sortType={sortType}
                        sortOrder={sortOrder}
                        onSort={handleSort}/>
                </div>
                <ComponentList
                    loading={isPending}
                    components={components}
                    scrollContainerRef={mainRef}
                    searchTerm={searchTerm}
                    selectedTags={filterMap[FilterType.Tag]?.value ?? []}
                    limit={LIMIT}
                    onResetFilters={handleResetFilters}
                    onEnd={handleEnd}/>
            </div>
        </main>
    );
}

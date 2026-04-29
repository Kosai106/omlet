import { Fragment, useEffect, useMemo, useState } from "react";

import classNames from "classnames";

import { type Tag as TagModel, RESERVED_TAGS } from "../../../../../common/models/Tag";
import { pluralize } from "../../../../../common/utils";
import { TruncateFromMiddle } from "../../../../common/truncate/TruncateFromMiddle";
import { useWindowSize } from "../../../../hooks/useWindowSize";
import { Dropdown } from "../../../../library/Dropdown/Dropdown";
import { IconCollapse } from "../../../../library/icons/IconCollapse";
import { IconFilter } from "../../../../library/icons/IconFilter";
import { PopoverDirection } from "../../../../library/Popover/Popover";
import { SearchInput } from "../../../../library/SearchInput/SearchInput";
import { SegmentedControl } from "../../../../library/SegmentedControl/SegmentedControl";
import { Skeleton } from "../../../../library/Skeleton/Skeleton";
import { Tag } from "../../../../library/Tag/Tag";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";
import { type Component } from "../../../../models/Component";
import { useStore } from "../../../../providers/StoreProvider/StoreProvider";
import { generateGetTextWidth, range, toOrdinal } from "../../../../utils";
import { type ComponentWithLevel } from "../../ComponentDetail";
import { DropdownTags } from "../../dropdownTags/DropdownTags";

import classes from "./DependencyList.module.css";

const LINE_WIDTH = 252;
const TAG_SPACE = 24;

export enum DependencyType {
    Parents = "parents",
    Children = "children",
}

interface EmptyStateProps {
    mainText: string;
    resetText?: string;
    onResetClick?: () => void;
}

function EmptyState({ mainText, resetText, onResetClick }: EmptyStateProps) {
    return <div className={classes.emptyState}>
        <div className={classes.shrug}>¯\_(ツ)_/¯</div>
        <div className={classes.text}>
            <p>{mainText}</p>
            {onResetClick && (
                <button className={classes.resetButton} type="button" onClick={onResetClick}>
                    {resetText}
                </button>
            )}
        </div>
    </div>;
}

interface DependencyListItemProps {
    allTags: TagModel[];
    withBorder: boolean;
    selected: boolean;
    component: ComponentWithLevel;
    onClick: () => void;
}
function DependencyListItem({
    allTags,
    withBorder,
    selected,
    component: { numOfUsages, tags: tagSlugs, name, packageName },
    onClick,
}: DependencyListItemProps) {
    const { width: windowWidth } = useWindowSize();
    const getTagWidth = useMemo(() => generateGetTextWidth("11px"), []);
    const getPackageNameWidth = useMemo(() => generateGetTextWidth("12px"), []);
    const [shownTagLength, setShownTagLength] = useState(0);
    const tags = useMemo(() => allTags.filter(({ slug }) => tagSlugs.includes(slug)), [tagSlugs, allTags]);

    useEffect(() => {
        let remainingWidth = LINE_WIDTH - getPackageNameWidth(packageName);
        let shownTagLength = 0;
        for (const tag of tags) {
            remainingWidth -= getTagWidth(tag.name) + TAG_SPACE;
            if (remainingWidth < 0) {
                break;
            }
            shownTagLength += 1;
        }
        if (tags.length > 0 && shownTagLength === 0) {
            shownTagLength = 1;
        }
        setShownTagLength(shownTagLength);
    }, [packageName, tags, windowWidth]);

    return (
        <div className={classNames(classes.item, { [classes.withBorder]: withBorder })} onClick={onClick}>
            <div className={classNames(classes.inner, { [classes.selected]: selected })}>
                <div className={classes.mainRow}>
                    <TruncateFromMiddle className={classes.name} text={name}/>
                    <Tooltip content={`Used ${pluralize("time", numOfUsages)}`}>
                        <span className={classes.usage}>
                            #{numOfUsages}
                        </span>
                    </Tooltip>
                </div>
                <div className={classes.detailsRow}>
                    <TruncateFromMiddle className={classes.packageName} text={packageName}/>
                    {tags.slice(0, shownTagLength).map(tag => <Tag key={tag.slug} tag={tag} />)}
                    {tags.length > shownTagLength && (
                        <Tooltip content={tags.slice(shownTagLength).map(({ name }) => name).join("\n")}>
                            <div className={classes.moreTagsIndicator}>
                                +{tags.length - shownTagLength}
                            </div>
                        </Tooltip>
                    )}
                </div>
            </div>
        </div>
    );
}

const NUMBER_OF_SKELETON_ITEMS = 8;

export interface Filters {
    dependencyType?: DependencyType;
    selectedTags: string[];
    selectedLevel?: number;
    selectedProject?: string;
    searchValue: string;

}
interface Props {
    loading?: boolean;
    mainComponent?: Component;
    parents: ComponentWithLevel[];
    children: ComponentWithLevel[];
    filters: Filters;
    onFiltersChange: (value: Filters) => void;
    selectedComponentId?: string;
    onSelectedComponentIdChange: (value?: string) => void;
}
export function DependencyList({
    loading = false,
    mainComponent,
    parents,
    children,
    filters,
    onFiltersChange,
    selectedComponentId,
    onSelectedComponentIdChange,
}: Props) {
    const {
        dependencyType = parents.length === 0 && children.length > 0 ? DependencyType.Children : DependencyType.Parents,
        selectedTags,
        selectedLevel,
        selectedProject,
        searchValue,
    } = filters;
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { selectors: { getTags, getWorkspace } } = useStore();
    const allTags = getTags();
    const workspace = getWorkspace();

    const components = useMemo(() => {
        return (
            dependencyType === DependencyType.Parents ? parents : children
        ).sort((a, b) => b.numOfUsages - a.numOfUsages);
    }, [parents, children, dependencyType]);

    const packageNames = useMemo(() => {
        return [...new Set(components.map(({ packageName }) => packageName))];
    }, [components, workspace!.projects]);
    const levels = useMemo(() => [...new Set(
        components.map(({ level }) => level)
            .sort((a, b) => Math.abs(a) - Math.abs(b))
    )], [components]);

    const filteredComponents = useMemo(() => {
        const result = components.filter(({ level, name, packageName, tags }) => (
            name.toLowerCase().includes(searchValue.trim().toLowerCase())
            && (selectedProject === undefined || selectedProject === packageName)
            && (selectedLevel === undefined || selectedLevel === level)
            && (selectedTags.length === 0 || selectedTags.every(t => t === RESERVED_TAGS.UNTAGGED.slug ? tags.length === 0 : tags.includes(t)))
        ));
        result.sort((a, b) => Math.abs(a.level) - Math.abs(b.level));
        return result;
    }, [searchValue, components, selectedProject, selectedTags, selectedLevel]);

    function handleCollapseClick() {
        setIsCollapsed(true);
    }

    function handleExpandClick() {
        setIsCollapsed(false);
    }

    function handleDependencyTypeChange(next: DependencyType) {
        onFiltersChange({
            dependencyType: next,
            selectedTags: [],
            searchValue: "",
        });
    }

    function handleSearch(next: string) {
        onFiltersChange({
            ...filters,
            searchValue: next,
        });
    }

    function handleSelectedPackageChange(next: string) {
        onFiltersChange({
            ...filters,
            selectedProject: selectedProject === next ? undefined : next,
        });
    }

    function handleSelectedTagsChange(next: string[]) {
        onFiltersChange({
            ...filters,
            selectedTags: next,
        });
    }

    function handleSelectedLevelChange(next: number) {
        onFiltersChange({
            ...filters,
            selectedLevel: selectedLevel === next ? undefined : next,
        });
    }

    function handleSelectedComponentChange(component: ComponentWithLevel) {
        onSelectedComponentIdChange(component.id === selectedComponentId ? undefined : component.id);
    }

    function handleResetClick() {
        if (components.length > 0) {
            handleDependencyTypeChange(dependencyType);
        } else {
            handleDependencyTypeChange(dependencyType === DependencyType.Parents ? DependencyType.Children : DependencyType.Parents);
        }
    }

    function getEmptyStateText() {
        if (components.length > 0) {
            return "No results with this selection";
        }
        return (
            dependencyType === DependencyType.Parents
                ? "No parent components"
                : "No child components"
        );
    }

    function getEmptyStateResetText() {
        if (components.length > 0) {
            return "Remove filters";
        }
        return (
            dependencyType === DependencyType.Parents
                ? "Back to Children"
                : "Back to Parents"
        );
    }

    function renderDescription() {
        if (dependencyType === DependencyType.Parents) {
            return (
                <div className={classes.text}>
                    Where
                    {" "}
                    <TruncateFromMiddle text={mainComponent ? mainComponent.name : "this component"} width={161}/>
                    {" "}
                    is used
                </div>
            );
        }

        return (
            <div className={classes.text}>
                Components used in
                {" "}
                <TruncateFromMiddle text={mainComponent ? mainComponent.name : "this component"} width={118}/>
            </div>
        );
    }

    function renderContent() {
        if (loading) {
            return (
                <>
                    <div className={classes.header}>
                        1ST LEVEL
                        {" "}
                        {dependencyType === DependencyType.Parents ? "PARENTS" : "CHILDREN"}
                    </div>
                    {[...range(1, NUMBER_OF_SKELETON_ITEMS)].map(i => (
                        <div
                            key={i}
                            className={classNames(
                                classes.item,
                                classes.loading,
                                { [classes.withBorder]: i !== 1 }
                            )}>
                            <div className={classes.inner}>
                                <div className={classes.mainRow}>
                                    <Skeleton className={classes.skeleton} />
                                </div>
                                <div className={classes.detailsRow}>
                                    <Skeleton className={classes.skeleton} />
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            );
        }

        if (filteredComponents.length === 0) {
            return (
                <EmptyState
                    mainText={getEmptyStateText()}
                    resetText={getEmptyStateResetText()}
                    onResetClick={parents.length === 0 && children.length === 0 ? undefined : handleResetClick} />
            );
        }

        return filteredComponents.map((component, i) => (
            <Fragment key={component.id}>
                {(i === 0 || filteredComponents[i - 1].level !== component.level) && (
                    <div className={classes.header}>
                        {toOrdinal(Math.abs(component.level)).toUpperCase()}
                        {" "}
                        LEVEL
                        {" "}
                        {dependencyType === DependencyType.Parents ? "PARENTS" : "CHILDREN"}
                    </div>
                )}
                <DependencyListItem
                    allTags={allTags}
                    selected={component.id === selectedComponentId}
                    withBorder={i !== 0 && filteredComponents[i - 1].level === component.level}
                    component={component}
                    onClick={() => handleSelectedComponentChange(component)}/>
            </Fragment>
        ));
    }

    if (isCollapsed) {
        return (
            <button
                type="button"
                className={classes.expandButton}
                onClick={handleExpandClick}>
                <IconFilter />
            </button>
        );
    }

    return (
        <div className={classes.dependencyList}>
            <div className={classes.header}>
                <div className={classes.row}>
                    <SegmentedControl onChange={handleDependencyTypeChange} value={loading ? undefined : dependencyType}>
                        <SegmentedControl.Option value={DependencyType.Parents}>
                            Parents
                        </SegmentedControl.Option>
                        <SegmentedControl.Option value={DependencyType.Children}>
                            Children
                        </SegmentedControl.Option>
                    </SegmentedControl>
                </div>
                {renderDescription()}
                <div className={classes.row}>
                    <SearchInput className={classes.search} value={searchValue} disabled={components.length === 0} onSearch={handleSearch}/>
                </div>
                <div className={classes.row}>
                    {workspace!.projects.length > 1 && (
                        <Dropdown
                            className={classNames(classes.filter, classes.priority)}
                            offset={8}
                            value={selectedProject}
                            optionsDirection={PopoverDirection.Vertical}
                            options={packageNames.map((value) => ({ value, label: value }))}
                            placeholder="Project"
                            disabled={components.length === 0}
                            onChange={handleSelectedPackageChange} />
                    )}
                    <DropdownTags
                        className={classes.filter}
                        values={selectedTags}
                        tags={[...allTags, RESERVED_TAGS.UNTAGGED]}
                        disabled={components.length === 0}
                        onChange={handleSelectedTagsChange} />
                    <Dropdown
                        className={classes.filter}
                        optionsClassName={classes.filterPopup}
                        optionsDirection={PopoverDirection.BottomLeft}
                        offset={8}
                        value={selectedLevel}
                        options={levels.map((value) => ({
                            value,
                            label: `${toOrdinal(Math.abs(value))} level ${dependencyType === DependencyType.Parents ? "parents" : "children"}`,
                        }))}
                        disabled={components.length === 0}
                        placeholder="Level"
                        onChange={handleSelectedLevelChange} />
                </div>
                <button
                    type="button"
                    className={classes.collapseButton}
                    onClick={handleCollapseClick}>
                    <IconCollapse />
                </button>
            </div>
            <div className={classes.list}>
                {renderContent()}
            </div>
        </div>
    );
}

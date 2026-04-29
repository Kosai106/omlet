import classNames from "classnames";

import { pluralize } from "../../../../common/utils";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconChevronUp } from "../../../library/icons/IconChevronUp";
import { SortOrder } from "../../../models/SortOrder";
import { SortType } from "../../../models/SortType";

import classes from "./ComponentListHeader.module.css";

interface HeaderProps {
    componentCount?: number;
    sortType: SortType;
    sortOrder: SortOrder;
    onSort(sortType: SortType): void;
}

export function ComponentListHeader({ componentCount, sortType, sortOrder, onSort }: HeaderProps) {
    const icon = sortOrder === SortOrder.Descending
        ? <IconChevronDown color="var(--label-secondary-color)"/>
        : <IconChevronUp color="var(--label-secondary-color)"/>;

    return (
        <div className={classes.header}>
            <span className={classes.mainColumn}>
                {componentCount === undefined ? "All components" : pluralize("component", componentCount)}
            </span>
            <button
                type="button"
                className={classes.column}
                onClick={() => onSort(SortType.Created)}>
                Created{sortType === SortType.Created ? icon : null}
            </button>
            <button
                type="button"
                className={classes.column}
                onClick={() => onSort(SortType.Updated)}>
                Updated{sortType === SortType.Updated ? icon : null}
            </button>
            <button
                type="button"
                className={classNames(classes.column, classes.usageCount)}
                onClick={() => onSort(SortType.Usage)}>
                # Used{sortType === SortType.Usage ? icon : null}
            </button>
        </div>
    );
}

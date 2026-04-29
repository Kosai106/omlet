import { useEffect, useState } from "react";

import { type Filter, hasSameFilters, areFiltersComplete, getKey } from "../../../../../common/models/Filter";
import { H3 } from "../../../../library/Heading/Heading";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";
import { WidgetButton } from "../widgetButton/WidgetButton";

import { FilterCell } from "./filterCell/FilterCell";

import classes from "./FilterWidget.module.css";

interface Props {
    filters: Partial<Filter>[];
    disabled?: boolean;
    onFiltersChange(filters: Filter[]): void;
}

export function FilterWidget({
    filters: initialFilters,
    disabled = false,
    onFiltersChange,
}: Props) {
    const [filters, setFilters] = useState<Partial<Filter>[]>(initialFilters);

    function handleAddClick() {
        setFilters(oldFilters => [...oldFilters, {} as Partial<Filter>]);
    }

    function handleSetFilter(filter: Partial<Filter>, index: number) {
        setFilters(oldFilters => oldFilters.map((oldFilter, idx) => idx === index ? filter : oldFilter));
    }

    function handleRemoveFilter(index: number) {
        setFilters(oldFilters => oldFilters.filter((_oldFilter, idx) => idx !== index));
    }

    useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    useEffect(() => {
        if (
            areFiltersComplete(initialFilters) &&
            areFiltersComplete(filters) &&
            !hasSameFilters(initialFilters, filters)
        ) {
            onFiltersChange(filters);
        }
    }, [filters]);

    function renderCells() {
        return filters.map((filter, index) => {
            return (
                <FilterCell
                    key={`${getKey(filter)}-${index}`}
                    index={index}
                    type={filter.type}
                    operation={filter.operation}
                    value={filter.value}
                    disabled={disabled}
                    onSetFilter={handleSetFilter}
                    onRemoveFilter={handleRemoveFilter}/>
            );
        });
    }

    function renderAddButton() {
        const lastFilter = filters[filters.length - 1];
        if (
            filters.length !== 0 &&
            (Array.isArray(lastFilter.value) ? lastFilter.value.length === 0 : lastFilter.value === undefined)
        ) {
            return null;
        }

        return (
            <div className={classes.buttonContainer}>
                <Tooltip content={disabled ? "Ask to join workspace to edit" : undefined} followCursor>
                    <WidgetButton onClick={handleAddClick} disabled={disabled}>
                        Add
                    </WidgetButton>
                </Tooltip>
            </div>
        );
    }

    return (
        <div className={classes.filterWidget}>
            <H3 className={classes.title}>Filter by</H3>
            {renderCells()}
            {renderAddButton()}
        </div>
    );
}

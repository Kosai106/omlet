import { useState } from "react";

import classNames from "classnames";

import { Checkbox } from "../../../library/Checkbox/Checkbox";
import { Dropdown } from "../../../library/Dropdown/Dropdown";
import { PopoverDirection } from "../../../library/Popover/Popover";
import { SearchInput } from "../../../library/SearchInput/SearchInput";
import { TruncateFromMiddle } from "../../truncate/TruncateFromMiddle";
import { InfiniteScroll } from "../infiniteScroll/InfiniteScroll";

import { type LegendItem } from "./LegendItem";


import classes from "./InteractiveLegend.module.css";


export enum SortType {
    Value = "value",
    ValueIncrease = "valueIncrease",
}

interface Props {
    className?: string;
    items: LegendItem[];
    valueLabel: string;
    searchValue: string;
    sortType?: SortType;
    selectedItems: Set<string>;
    onSearch(value: string): void;
    onSortChange?(value: SortType): void;
    onItemMouseEnter?(id: string): void;
    onItemMouseLeave?(id: string): void;
    onItemChange(id: string, checked: boolean): void;
}
const PAGE_SIZE = 50;
export function InteractiveLegend({
    className,
    items,
    valueLabel,
    searchValue,
    sortType,
    selectedItems,
    onSearch,
    onSortChange,
    onItemMouseEnter,
    onItemMouseLeave,
    onItemChange,
}: Props) {
    const [sliceSize, setSliceSize] = useState(PAGE_SIZE);

    function handleSearch(term: string) {
        onSearch(term);
    }

    function handleSortChange(value: SortType) {
        onSortChange?.(value);
    }

    const sortOptions = [{
        value: SortType.Value,
        label: `number of ${valueLabel}s`,
    }, {
        value: SortType.ValueIncrease,
        label: "most increased",
    }];

    const visibleItems = items.filter(({ name }) => name?.toLowerCase().includes(searchValue.toLowerCase())).slice(0, sliceSize);

    return (
        <div className={classNames(classes.interactiveLegend, className)}>
            <SearchInput value={searchValue} onSearch={handleSearch} />
            {sortType && (
                <Dropdown
                    options={sortOptions}
                    value={sortType}
                    optionsDirection={PopoverDirection.Vertical}
                    showValueInButton
                    onChange={handleSortChange}/>
            )}
            <InfiniteScroll
                className={classes.items}
                hasNext={sliceSize < items.length}
                onEnd={() => setSliceSize(prev => prev + PAGE_SIZE)}>
                {visibleItems.map(({ id, name, color }) => (
                    <label
                        key={id}
                        className={classes.legendItem}
                        onMouseEnter={() => onItemMouseEnter?.(id)}
                        onMouseLeave={() => onItemMouseLeave?.(id)}>
                        <Checkbox.Solid
                            color={color}
                            value={id}
                            checked={selectedItems.has(id)}
                            onChange={onItemChange}/>
                        <TruncateFromMiddle text={name} className={classes.legendItemLabel} width={124} />
                    </label>
                ))}
            </InfiniteScroll>
        </div>
    );
}

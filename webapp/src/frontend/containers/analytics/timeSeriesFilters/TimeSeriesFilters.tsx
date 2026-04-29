import classNames from "classnames";

import { type DataFrequencyOption } from "../../../../common/models/DataFrequencyOption";
import { type TimeSeriesFilter, DEFAULT_TIME_SERIES_FILTER } from "../../../../common/models/TimeSeriesFilter";
import { TimeWindowOption, getTimeWindowOptionLabel, availableFrequencyOptionsForTimeWindows } from "../../../../common/models/TimeWindowOption";
import { Dropdown } from "../../../library/Dropdown/Dropdown";
import { PopoverDirection } from "../../../library/Popover/Popover";

import classes from "./TimeSeriesFilters.module.css";


const timeWindowOptions = Object.values(TimeWindowOption).map(key => ({
    label: getTimeWindowOptionLabel(key),
    value: key,
}));

interface Props {
    className?: string;
    timeSeriesFilter?: TimeSeriesFilter;
    onTimeSeriesFilterChange(filter: TimeSeriesFilter): void;
}

export function TimeSeriesFilters({
    className,
    timeSeriesFilter,
    onTimeSeriesFilterChange,
}: Props) {
    function onTimeWindowChange(timeWindow: TimeWindowOption) {
        onTimeSeriesFilterChange({
            timeWindow,
            frequency: availableFrequencyOptionsForTimeWindows[timeWindow][0],
        });
    }

    function onDataFrequencyChange(frequency: DataFrequencyOption) {
        onTimeSeriesFilterChange({
            timeWindow: timeSeriesFilter?.timeWindow ?? DEFAULT_TIME_SERIES_FILTER.timeWindow,
            frequency,
        });
    }

    const dataFrequencyOptions = timeSeriesFilter ? availableFrequencyOptionsForTimeWindows[timeSeriesFilter.timeWindow]
        .map(key => ({
            label: key,
            value: key,
        })) : [];
    return (
        <div className={classNames(classes.timeSeriesFilters, className)}>
            <Dropdown
                className={classes.timeSeriesFilterDropdown}
                placeholder="Time Window"
                optionsClassName={classes.timeSeriesFilterDropdownOption}
                options={timeWindowOptions}
                value={timeSeriesFilter?.timeWindow}
                optionsDirection={PopoverDirection.BottomLeft}
                offset={0}
                showValueInButton
                onChange={onTimeWindowChange}/>
            {!!dataFrequencyOptions.length && (
                <Dropdown
                    className={classes.timeSeriesFilterDropdown}
                    placeholder="Frequency"
                    optionsClassName={classes.timeSeriesFilterDropdownOption}
                    options={dataFrequencyOptions}
                    value={timeSeriesFilter?.frequency}
                    optionsDirection={PopoverDirection.BottomLeft}
                    offset={0}
                    showValueInButton
                    onChange={onDataFrequencyChange}/>
            )}
        </div>
    );
}

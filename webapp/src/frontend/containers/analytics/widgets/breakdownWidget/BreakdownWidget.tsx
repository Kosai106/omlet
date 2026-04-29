import { useState } from "react";

import { type AnalysisSubject } from "../../../../../common/models/AnalysisSubject";
import { type BreakdownType, getBreakdownTypeLabel, getValidBreakdownTypes } from "../../../../../common/models/BreakdownType";
import { type DropdownOption } from "../../../../library/Dropdown/DropdownOption";
import { H3 } from "../../../../library/Heading/Heading";
import { IconRemove } from "../../../../library/icons/IconRemove";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";
import { WidgetButton } from "../widgetButton/WidgetButton";
import { WidgetDropdown } from "../widgetDropdown/WidgetDropdown";

import classes from "./BreakdownWidget.module.css";

interface Props {
    analysisSubject?: AnalysisSubject;
    breakdownType?: BreakdownType;
    disabled?: boolean;
    onBreakdownChange(type: BreakdownType | undefined): void;
}

function getBreakdownOption(breakdownType: BreakdownType): DropdownOption<BreakdownType> {
    return {
        value: breakdownType,
        label: getBreakdownTypeLabel(breakdownType),
    };
}

export function BreakdownWidget({
    analysisSubject,
    breakdownType,
    disabled = false,
    onBreakdownChange,
}: Props) {
    const [shouldSelectBreakdown, setShouldSelectBreakdown] = useState(false);

    function handleSelectClick() {
        setShouldSelectBreakdown(true);
    }

    function handleBreakdownCancel() {
        setShouldSelectBreakdown(false);
    }

    function handleBreakdownChange(newBreakdownType: BreakdownType) {
        setShouldSelectBreakdown(false);
        onBreakdownChange(newBreakdownType);
    }

    function handleRemoveClick() {
        setShouldSelectBreakdown(false);
        onBreakdownChange(undefined);
    }

    function renderBreakdownValue() {
        const breakdownOptions = getValidBreakdownTypes(analysisSubject);
        const options = breakdownOptions.map(getBreakdownOption);

        if (breakdownType) {
            return (
                <WidgetDropdown
                    className={classes.breakdownDropdown}
                    options={options}
                    value={breakdownType}
                    disabled={disabled}
                    onChange={handleBreakdownChange}/>
            );
        }

        if (shouldSelectBreakdown) {
            return (
                <WidgetDropdown
                    className={classes.breakdownDropdown}
                    options={options}
                    disabled={disabled}
                    open
                    onChange={handleBreakdownChange}
                    onCancel={handleBreakdownCancel}/>
            );
        }

        return (
            <WidgetButton onClick={handleSelectClick} disabled={disabled || analysisSubject === undefined}>
                Select
            </WidgetButton>
        );
    }

    return (
        <div className={classes.breakdownWidget}>
            <H3 className={classes.title}>Breakdown by</H3>
            <div className={classes.breakdownValue}>
                <Tooltip content={disabled ? "Ask to join workspace to edit" : undefined} followCursor>
                    {renderBreakdownValue()}
                </Tooltip>
                {!disabled && breakdownType && (
                    <button
                        type="button"
                        className={classes.removeButton}
                        onClick={handleRemoveClick}>
                        <IconRemove/>
                    </button>
                )}
            </div>
        </div>
    );
}

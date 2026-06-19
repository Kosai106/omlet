import { useState } from "react";

import { type AnalysisSubject } from "../../../../../common/models/AnalysisSubject";
import { BreakdownType, getBreakdownTypeLabel, getValidBreakdownTypes } from "../../../../../common/models/BreakdownType";
import { type DropdownOption } from "../../../../library/Dropdown/DropdownOption";
import { H3 } from "../../../../library/Heading/Heading";
import { IconRemove } from "../../../../library/icons/IconRemove";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";
import { WidgetButton } from "../widgetButton/WidgetButton";
import { WidgetDropdown } from "../widgetDropdown/WidgetDropdown";

import classes from "./BreakdownWidget.module.css";

// A "break down by custom property" choice needs to carry which property to use,
// so we encode the property name into the option value (the base breakdown types
// are used verbatim).
const CUSTOM_PROPERTY_OPTION_PREFIX = "customProperty:";

interface Props {
    analysisSubject?: AnalysisSubject;
    breakdownType?: BreakdownType;
    customProperty?: string;
    customProperties?: Record<string, (string | number | boolean | Date)[]>;
    disabled?: boolean;
    onBreakdownChange(type: BreakdownType | undefined, customProperty?: string): void;
}

function getBreakdownOptions(
    analysisSubject: AnalysisSubject | undefined,
    customProperties: Record<string, unknown> | undefined,
): DropdownOption<string>[] {
    return getValidBreakdownTypes(analysisSubject).flatMap(breakdownType => {
        if (breakdownType === BreakdownType.CustomProperty) {
            return Object.keys(customProperties ?? {}).map(name => ({
                value: `${CUSTOM_PROPERTY_OPTION_PREFIX}${name}`,
                label: `Property: ${name}`,
            }));
        }

        return [{ value: breakdownType, label: getBreakdownTypeLabel(breakdownType) }];
    });
}

export function BreakdownWidget({
    analysisSubject,
    breakdownType,
    customProperty,
    customProperties,
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

    function handleBreakdownChange(optionValue: string) {
        setShouldSelectBreakdown(false);

        if (optionValue.startsWith(CUSTOM_PROPERTY_OPTION_PREFIX)) {
            onBreakdownChange(BreakdownType.CustomProperty, optionValue.slice(CUSTOM_PROPERTY_OPTION_PREFIX.length));
        } else {
            onBreakdownChange(optionValue as BreakdownType);
        }
    }

    function handleRemoveClick() {
        setShouldSelectBreakdown(false);
        onBreakdownChange(undefined);
    }

    function renderBreakdownValue() {
        const options = getBreakdownOptions(analysisSubject, customProperties);
        const value = breakdownType === BreakdownType.CustomProperty && customProperty
            ? `${CUSTOM_PROPERTY_OPTION_PREFIX}${customProperty}`
            : breakdownType;

        if (breakdownType) {
            return (
                <WidgetDropdown
                    className={classes.breakdownDropdown}
                    options={options}
                    value={value}
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

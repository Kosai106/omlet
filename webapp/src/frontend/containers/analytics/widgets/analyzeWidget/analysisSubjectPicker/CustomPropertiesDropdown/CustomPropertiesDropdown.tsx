import {
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type PropsWithChildren,
    useEffect,
    useRef,
    useState,
} from "react";

import classNames from "classnames";

import { AnalysisSubject, getAnalysisSubjectLabel } from "../../../../../../../common/models/AnalysisSubject";
import { FilterDataType } from "../../../../../../../common/models/FilterDataType";
import { Keyboard } from "../../../../../../enums";
import { type DropdownOption } from "../../../../../../library/Dropdown/DropdownOption";
import { IconAddMetadata } from "../../../../../../library/icons/IconAddMetadata";
import { IconMetadata } from "../../../../../../library/icons/IconMetadata";
import { IconSearch } from "../../../../../../library/icons/IconSearch";
import { Popover, PopoverDirection } from "../../../../../../library/Popover/Popover";
import { CustomPropertiesDialog } from "../../../../../../pages/components/customPropertiesDialog/CustomPropertiesDialog";
import { getCustomPropertyTypes, scrollIntoViewIfNecessary } from "../../../../../../utils";
import { AnalysisSubjectTooltip } from "../AnalysisSubjectTooltip/AnalysisSubjectTooltip";

import classes from "./CustomPropertiesDropdown.module.css";

interface OptionsProps {
    options: DropdownOption<string>[];
    value?: string;
    callout?: string;
    disabled: boolean;
    onSelect(value: string): void;
}

function Options({
    options,
    value,
    callout,
    disabled,
    onSelect,
}: OptionsProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const focusedOptionsRef = useRef<HTMLDivElement>(null);

    const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);
    const [visibleOptions, setVisibleOptions] = useState<DropdownOption<string>[]>(options);

    function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        switch (event.code) {
            case Keyboard.Code.Escape:
                if (event.currentTarget.value) {
                    event.stopPropagation();
                }
                break;
            case Keyboard.Code.Enter:
                event.stopPropagation();
                inputRef.current?.blur();
                setFocusedOptionIndex(0);
                break;
        }
    }

    function handleSearch(event: ChangeEvent<HTMLInputElement>) {
        const searchValue = event.target.value.trim();
        const filteredOptions = options.filter(({ label }) => label.toLowerCase().includes(searchValue.toLowerCase()));

        setFocusedOptionIndex(null);
        setVisibleOptions(filteredOptions);
    }

    function handleOptionMouseMove(index: number) {
        setFocusedOptionIndex(index);
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.ArrowDown:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOptionIndex === null) {
                    setFocusedOptionIndex(0);
                } else {
                    setFocusedOptionIndex((focusedOptionIndex + 1) % visibleOptions.length);
                }
                break;

            case Keyboard.Code.ArrowUp:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOptionIndex === null) {
                    setFocusedOptionIndex(visibleOptions.length);
                } else {
                    setFocusedOptionIndex((focusedOptionIndex - 1 + visibleOptions.length) % visibleOptions.length);
                }
                break;

            case Keyboard.Code.Space:
            case Keyboard.Code.Enter:
                if (focusedOptionIndex !== null) {
                    event.preventDefault();
                    onSelect(visibleOptions[focusedOptionIndex].value);
                }
                break;

            default:
                inputRef.current?.focus();
        }
    }

    useEffect(() => {
        if (focusedOptionsRef.current) {
            scrollIntoViewIfNecessary(focusedOptionsRef.current, 4);
        }
    }, [focusedOptionsRef.current]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [focusedOptionIndex, visibleOptions]);

    function renderSearchInput() {
        return (
            <div className={classes.searchInput}>
                <IconSearch/>
                <input
                    ref={inputRef}
                    type="search"
                    placeholder="Search for property"
                    spellCheck={false}
                    autoFocus
                    onFocus={() => setFocusedOptionIndex(null)}
                    onKeyDown={handleInputKeyDown}
                    onChange={handleSearch}/>
            </div>
        );
    }

    function renderCallout() {
        if (callout) {
            return (
                <div
                    className={classes.callout}>
                    {callout}
                </div>
            );
        }
    }

    function renderContent() {
        if (options.length === 0) {
            return renderCallout();
        }

        if (visibleOptions.length === 0) {
            return (
                <>
                    {renderSearchInput()}
                    <div className={classes.empty}>
                        No custom properties with the name “{inputRef.current?.value}”
                    </div>
                </>
            );
        }

        return (
            <>
                {renderSearchInput()}
                <div className={classes.options}>
                    {visibleOptions.map(({ label, value: optionValue }, index) => {
                        const hovered = index === focusedOptionIndex;
                        const className = classNames(classes.option, {
                            [classes.selected]: optionValue === value,
                            [classes.hover]: hovered,
                            [classes.disabled]: disabled,
                        });

                        return (
                            <div
                                key={label}
                                ref={hovered ? focusedOptionsRef : undefined}
                                className={className}
                                onMouseMove={disabled ? undefined : () => handleOptionMouseMove(index)}
                                onClick={disabled ? undefined : () => onSelect(optionValue)}>
                                <span className={classes.optionLabel} title={label}>{label}</span>
                            </div>
                        );
                    })}
                </div>
                {renderCallout()}
            </>
        );
    }

    return (
        <div className={classes.optionsPopup}>
            {renderContent()}
        </div>
    );
}

interface Props {
    customProperties?: Record<string, (string | number | boolean | Date)[]>;
    value?: string;
    tooltipDelay: number;
    selected?: boolean;
    disabled?: boolean;
    onChange(customProperty: string): void;
}

export function CustomPropertiesDropdown({
    customProperties = {},
    value,
    tooltipDelay,
    selected = false,
    disabled = false,
    onChange,
}: PropsWithChildren<Props>) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [isDisalogVisible, setIsDialogVisible] = useState(false);

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
    }

    function handleSelect(value: string) {
        onChange(value);
        closeOptions();
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    const customPropertyNames = Object.keys(customProperties);

    if (customPropertyNames.length === 0 && !selected) {
        return (
            <>
                <button
                    className={classes.customPropertiesDropdown}
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsDialogVisible(true)}>
                    <IconAddMetadata/>
                    Custom properties
                </button>
                {isDisalogVisible && <CustomPropertiesDialog onClose={() => setIsDialogVisible(false)}/>}
            </>
        );
    }

    const customPropertyTypes = getCustomPropertyTypes(customProperties);
    const options = customPropertyNames
        .filter(customProperty => customPropertyTypes[customProperty] === FilterDataType.String)
        .map(customProperty => ({ value: customProperty, label: customProperty }));

    function getLabel() {
        if (value) {
            return `Property: ${value}`;
        }

        return getAnalysisSubjectLabel(AnalysisSubject.CustomProperties);
    }

    function getCallout() {
        let hasStringCustomProperty;
        let hasNonStringCustomProperty;
        for (const type of Object.values(customPropertyTypes)) {
            if (type === FilterDataType.String) {
                hasStringCustomProperty = true;
            } else {
                hasNonStringCustomProperty = true;
            }

            if (hasStringCustomProperty && hasNonStringCustomProperty) {
                break;
            }
        }

        if (hasNonStringCustomProperty) {
            if (hasStringCustomProperty) {
                return "Only string type custom properties can be analyzed using charts.";
            } else {
                return "All your custom properties are non-string type — only string type custom properties can be analyzed using charts.";
            }
        }
    }

    const cls = classNames(classes.customPropertiesDropdown, {
        [classes.open]: isOpen,
        [classes.selected]: selected,
    });

    return (
        <AnalysisSubjectTooltip
            analysisSubject={AnalysisSubject.CustomProperties}
            delay={tooltipDelay}
            disabled={disabled}>
            <button
                type="button"
                ref={dropdownRef}
                className={cls}
                disabled={disabled}
                onClick={openOptions}>
                <IconMetadata/>
                {getLabel()}
                {isOpen && isRendered && (
                    <Popover
                        anchor={dropdownRef.current!}
                        direction={PopoverDirection.Horizontal}
                        offset={8}
                        onClose={closeOptions}
                        onCancel={closeOptions}>
                        <Options
                            options={options}
                            value={value}
                            callout={getCallout()}
                            disabled={disabled}
                            onSelect={handleSelect}/>
                    </Popover>
                )}
            </button>
        </AnalysisSubjectTooltip>
    );
}

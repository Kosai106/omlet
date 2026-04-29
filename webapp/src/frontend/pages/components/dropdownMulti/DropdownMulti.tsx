import {
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
    useEffect,
    useRef,
    useState,
    useMemo,
} from "react";

import classNames from "classnames";

import { TruncateEnd } from "../../../common/truncate/TruncateEnd/TruncateEnd";
import { TruncateFromMiddle } from "../../../common/truncate/TruncateFromMiddle";
import { Keyboard } from "../../../enums";
import { Checkbox } from "../../../library/Checkbox/Checkbox";
import { type DropdownOption } from "../../../library/Dropdown/DropdownOption";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconRemove } from "../../../library/icons/IconRemove";
import { IconSearch } from "../../../library/icons/IconSearch";
import { PopoverDirection, Popover } from "../../../library/Popover/Popover";
import { scrollIntoViewIfNecessary } from "../../../utils";

import classes from "./DropdownMulti.module.css";

interface OptionsProps<T> {
    options: DropdownOption<T>[];
    values: T[];
    onChange(values: T[]): void;
    onSubmit(): void;
}

function Options<T>({
    options,
    values,
    onChange,
    onSubmit,
}: OptionsProps<T>) {
    const inputRef = useRef<HTMLInputElement>(null);
    const focusedOptionsRef = useRef<HTMLLabelElement>(null);

    const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);
    const [visibleOptions, setVisibleOptions] = useState<DropdownOption<T>[]>(options);

    const isSelectAllChecked = useMemo(() => {
        return visibleOptions
            .every(visibleOption => values.some(value => value === visibleOption.value));
    }, [visibleOptions, values]);

    const isSelectAllIndeterminate = useMemo(() => {
        return visibleOptions.some(visibleOption => values.some(value => value === visibleOption.value)) &&
            !isSelectAllChecked;
    }, [visibleOptions, values, isSelectAllChecked]);

    function handleSelectAllChange() {
        if (isSelectAllChecked || isSelectAllIndeterminate) {
            onChange([]);
        } else {
            onChange(visibleOptions.map(({ value }) => value));
        }
    }

    function handleChange(value: T) {
        const selected = values.includes(value);

        if (selected) {
            onChange(values.filter(v => v !== value));
        } else {
            onChange([...values, value]);
        }
    }

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
                    setFocusedOptionIndex((focusedOptionIndex + 1) % (visibleOptions.length + 1));
                }
                break;

            case Keyboard.Code.ArrowUp:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOptionIndex === null) {
                    setFocusedOptionIndex(visibleOptions.length);
                } else {
                    setFocusedOptionIndex((focusedOptionIndex + visibleOptions.length) % (visibleOptions.length + 1));
                }
                break;

            case Keyboard.Code.Space:
                if (focusedOptionIndex === 0) {
                    event.preventDefault();
                    handleSelectAllChange();
                } else if (focusedOptionIndex !== null) {
                    event.preventDefault();
                    handleChange(visibleOptions[focusedOptionIndex - 1].value);
                }
                break;

            case Keyboard.Code.Enter:
                onSubmit();
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
    }, [focusedOptionIndex, visibleOptions, values]);

    function renderSelectAllOption() {
        const index = 0;
        const hovered = focusedOptionIndex === index;
        const className = classNames(classes.option, {
            [classes.selected]: isSelectAllChecked,
            [classes.hover]: hovered,
        });

        return (
            <label
                key="Select all"
                ref={hovered ? focusedOptionsRef : undefined}
                onMouseMove={() => handleOptionMouseMove(index)}
                className={className}>
                <Checkbox
                    className={classes.optionCheckbox}
                    value="Select All"
                    checked={isSelectAllChecked}
                    indeterminate={isSelectAllIndeterminate}
                    onChange={handleSelectAllChange}/>
                <span className={classes.optionLabel} title="Select all">Select all</span>
            </label>
        );
    }

    return (
        <div className={classes.optionsPopup}>
            <div className={classes.searchInput}>
                <IconSearch/>
                <input
                    ref={inputRef}
                    type="search"
                    placeholder="Search"
                    spellCheck={false}
                    autoFocus
                    onFocus={() => setFocusedOptionIndex(null)}
                    onKeyDown={handleInputKeyDown}
                    onChange={handleSearch}/>
            </div>
            <div className={classes.options}>
                {renderSelectAllOption()}
                {visibleOptions.map(({ value, label }, index) => {
                    const selected = values.includes(value);
                    const hovered = index + 1 === focusedOptionIndex;
                    const className = classNames(classes.option, {
                        [classes.selected]: selected,
                        [classes.hover]: hovered,
                    });

                    return (
                        <label
                            key={String(value)}
                            ref={hovered ? focusedOptionsRef : undefined}
                            onMouseMove={() => handleOptionMouseMove(index + 1)}
                            className={className}>
                            <Checkbox
                                className={classes.optionCheckbox}
                                value={value}
                                checked={selected}
                                onChange={handleChange}/>
                            <TruncateFromMiddle
                                className={classes.optionLabel}
                                text={label}/>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

interface Props<T> {
    className?: string;
    options: DropdownOption<T>[];
    icon?: ReactNode;
    label: string;
    optionsOffset?: number;
    values: T[];
    open?: boolean;
    onChange(values: T[]): void;
    onClose?(): void;
}

export function DropdownMulti<T>({
    className,
    options,
    icon,
    label,
    values,
    open = false,
    onChange,
    onClose,
}: Props<T>) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);

    const [selectedValues, setSelectedValues] = useState<T[]>(values);
    const selectedOptions = options.filter(({ value }) => values.includes(value)).map(({ label }) => label);

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
        onClose?.();
    }

    function handleOptionsChange(values: T[]) {
        setSelectedValues(values);
    }

    function handleSubmit() {
        onChange(selectedValues);
        closeOptions();
    }

    function handleCancel() {
        setSelectedValues(values);
        onChange(values);
        closeOptions();
    }

    function handleRemove() {
        onChange([]);
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    useEffect(() => {
        setSelectedValues(values);
    }, [values]);

    function renderMainLabel() {
        return <span className={classes.mainLabel}>{icon}{label}{selectedOptions.length === 0 ? "" : ":"}</span>;
    }

    function renderLabel() {
        if (selectedOptions.length === 0) {
            return renderMainLabel();
        }

        return (
            <div className={classes.label}>
                {renderMainLabel()}
                <TruncateEnd content={selectedOptions.join(", ")}/>
            </div>
        );
    }

    const cls = classNames(classes.dropdownMulti, className, {
        [classes.open]: isOpen,
    });

    return (
        <div className={classes.dropdownMultiContainer}>
            <button
                ref={dropdownRef}
                className={cls}
                onClick={openOptions}>
                {renderLabel()}
                <IconChevronDown color="var(--label-secondary-color)"/>
                {isOpen && isRendered && (
                    <Popover
                        anchor={dropdownRef.current!}
                        direction={PopoverDirection.Vertical}
                        onClose={handleSubmit}
                        onCancel={handleCancel}>
                        <Options
                            options={options}
                            values={selectedValues}
                            onChange={handleOptionsChange}
                            onSubmit={handleSubmit}/>
                    </Popover>
                )}
            </button>
            {!isOpen && (
                <button className={classes.removeButton} onClick={handleRemove}>
                    <IconRemove/>
                </button>
            )}
        </div>
    );
}

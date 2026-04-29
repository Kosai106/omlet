import {
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    useEffect,
    useRef,
    useState,
} from "react";

import classNames from "classnames";

import { Keyboard } from "../../../../enums";
import { Checkbox } from "../../../../library/Checkbox/Checkbox";
import { type DropdownOption } from "../../../../library/Dropdown/DropdownOption";
import { IconSearch } from "../../../../library/icons/IconSearch";
import { PopoverDirection, Popover } from "../../../../library/Popover/Popover";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";
import { scrollIntoViewIfNecessary } from "../../../../utils";

import { Spinner } from "./spinner/Spinner";

import classes from "./WidgetDropdownMulti.module.css";
interface OptionsProps<T> {
    options: DropdownOption<T>[];
    emptyText: string;
    values: DropdownOption<T>[];
    loading?: boolean;
    onSearch(term: string): void;
    onChange(values: DropdownOption<T>[]): void;
    onSubmit(): void;
}

function Options<T>({
    options,
    values,
    emptyText,
    loading = false,
    onSearch,
    onChange,
    onSubmit,
}: OptionsProps<T>) {
    const timeoutRef = useRef<number>();
    const inputRef = useRef<HTMLInputElement>(null);
    const focusedOptionsRef = useRef<HTMLLabelElement>(null);

    const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);

    function handleSearch(event: ChangeEvent<HTMLInputElement>) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(async () => {
            onSearch(event.target.value.trim());
        }, 300);
    }

    function handleOptionMouseMove(index: number) {
        setFocusedOptionIndex(index);
    }

    function handleSelectAllChange() {
        if (values.length !== 0) {
            onChange([]);
        } else {
            onChange(options);
        }
    }

    function handleChange(option: DropdownOption<T>) {
        const validValues = values.filter(({ isInvalid }) => !isInvalid);
        const isSelected = values.some(({ value }) => value === option.value);

        if (isSelected) {
            onChange(validValues.filter(v => v.value !== option.value));
        } else {
            onChange([...validValues, option]);
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

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.ArrowDown:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOptionIndex === null) {
                    setFocusedOptionIndex(0);
                } else {
                    setFocusedOptionIndex((focusedOptionIndex + 1) % options.length);
                }
                break;

            case Keyboard.Code.ArrowUp:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOptionIndex === null) {
                    setFocusedOptionIndex(options.length - 1);
                } else {
                    setFocusedOptionIndex((focusedOptionIndex - 1 + options.length) % options.length);
                }
                break;

            case Keyboard.Code.Space:
                if (focusedOptionIndex === 0) {
                    event.preventDefault();
                    handleSelectAllChange();
                } else if (focusedOptionIndex !== null) {
                    event.preventDefault();
                    handleChange(options[focusedOptionIndex - 1]);
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
    }, [focusedOptionIndex, values]);

    function renderSelectAllOption() {
        const index = 0;
        const selected = values.length === options.length;
        const indeterminate = values.length !== 0 && !selected;
        const hovered = focusedOptionIndex === index;
        const className = classNames(classes.option, {
            [classes.selected]: selected,
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
                    checked={selected}
                    indeterminate={indeterminate}
                    onChange={handleSelectAllChange}/>
                <span className={classes.optionLabel} title="Select all">Select all</span>
            </label>
        );
    }

    function renderOptions() {
        if (loading) {
            return null;
        }

        if (options.length > 0) {
            return (
                <div className={classes.options}>
                    {renderSelectAllOption()}
                    {options.map((option, index) => {
                        const selected = values.some(v => v.value === option.value);
                        const hovered = index + 1 === focusedOptionIndex;
                        const className = classNames(classes.option, {
                            [classes.selected]: selected,
                            [classes.hover]: hovered,
                        });

                        return (
                            <label
                                key={String(option.value)}
                                ref={hovered ? focusedOptionsRef : undefined}
                                onMouseMove={() => handleOptionMouseMove(index + 1)}
                                className={className}>
                                <Checkbox
                                    className={classes.optionCheckbox}
                                    value={option}
                                    checked={selected}
                                    onChange={handleChange}/>
                                <span className={classes.optionLabel} title={option.label}>{option.label}</span>
                            </label>
                        );
                    })}
                </div>
            );
        }

        if (emptyText) {
            return (
                <div className={classes.empty}>
                    {emptyText}
                </div>
            );
        }

        return null;
    }

    return (
        <div className={classes.optionsPopup}>
            <div className={classNames(classes.searchInput, { [classes.loading]: loading })}>
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
                {loading && <Spinner/>}
            </div>
            {renderOptions()}
        </div>
    );
}

interface Props<T> {
    className?: string;
    options: DropdownOption<T>[];
    emptyText: string;
    optionsOffset?: number;
    placeholder?: string;
    values: DropdownOption<T>[];
    open?: boolean;
    disabled?: boolean;
    loading?: boolean;
    onSearch(term: string): void;
    onChange(values: DropdownOption<T>[]): void;
    onCancel?: () => void;
}

export function WidgetDropdownMulti<T>({
    className,
    options,
    emptyText,
    placeholder = "Select value",
    values = [],
    open = false,
    disabled = false,
    loading,
    onSearch,
    onChange,
    onCancel,
}: Props<T>) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [selectedOptions, setSelectedOptions] = useState<DropdownOption<T>[]>(values);
    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);

    function openOptions() {
        setIsOpen(true);
    }

    function handleOptionsChange(newValues: DropdownOption<T>[]) {
        setSelectedOptions(newValues);
    }

    function handleSubmit() {
        onChange(selectedOptions);
        setIsOpen(false);
    }

    function handleCancel() {
        setSelectedOptions(values);
        setIsOpen(false);
        onCancel?.();
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    function renderTooltipContent() {
        if (disabled) {
            return "Ask to join workspace to edit";
        }

        return selectedOptions.map(option =>
            `${option.label}${option.isInvalid ? " (invalid)" : ""}`
        ).join("\n");
    }

    function renderValue() {
        if (selectedOptions.length === 0) {
            return <div className={classes.placeholder}>{placeholder}</div>;
        }

        return (
            <Tooltip content={renderTooltipContent()} followCursor>
                <div className={classes.selectedOptions}>
                    {selectedOptions.map(option =>
                        <span
                            key={String(option.value)}
                            className={classNames(classes.selectedOption, { [classes.invalidOption]: option.isInvalid })}>
                            {option.label}
                        </span>
                    )}
                </div>
            </Tooltip>
        );
    }

    const cls = classNames(classes.widgetDropdownMulti, className, {
        [classes.disabled]: disabled,
        [classes.open]: isOpen,
    });

    return (
        <div
            ref={dropdownRef}
            className={cls}
            onClick={disabled ? undefined : openOptions}>
            {renderValue()}
            {isOpen && isRendered && (
                <Popover
                    anchor={dropdownRef.current!}
                    direction={PopoverDirection.Horizontal}
                    offset={16}
                    onClose={handleSubmit}
                    onCancel={handleCancel}>
                    <Options
                        options={options}
                        emptyText={emptyText}
                        values={selectedOptions}
                        loading={loading}
                        onSearch={onSearch}
                        onChange={handleOptionsChange}
                        onSubmit={handleSubmit}/>
                </Popover>
            )}
        </div>
    );
}

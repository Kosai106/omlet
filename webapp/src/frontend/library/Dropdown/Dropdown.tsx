import { type MouseEvent, useEffect, useRef, useState } from "react";

import classNames from "classnames";

import { IconChevronDown } from "../icons/IconChevronDown";
import { PopoverDirection, Popover } from "../Popover/Popover";
import { Tooltip } from "../Tooltip/Tooltip";

import { type DropdownOption } from "./DropdownOption";

import classes from "./Dropdown.module.css";

interface OptionsProps<T> {
    className?: string;
    options: DropdownOption<T>[];
    value: T;
    onOptionClick(newValue: T): void;
}


function Options<T>({
    className,
    options,
    value,
    onOptionClick,
}: OptionsProps<T>) {
    function handleOptionClick(event: MouseEvent<HTMLDivElement>, newValue: T) {
        event.stopPropagation();
        onOptionClick(newValue);
    }

    return (
        <div className={classNames(classes.options, className)}>
            {options.map(({ value: optionValue, label }) => {
                const className = classNames(classes.option, { [classes.selected]: optionValue === value });
                return (
                    <div key={String(optionValue)} className={className} tabIndex={0} onClick={ev => handleOptionClick(ev, optionValue)}>
                        {label}
                    </div>
                );
            })}
        </div>
    );
}

interface Props<T> {
    className?: string;
    optionsClassName?: string;
    options: DropdownOption<T>[];
    placeholder?: string;
    value?: T;
    defaultValue?: T;
    optionsDirection?: PopoverDirection;
    offset?: number;
    open?: boolean;
    disabled?: boolean;
    showValueInButton?: boolean;
    hideChevron?: boolean;
    onChange(value: T): void;
    onCancel?: () => void;
}

export function Dropdown<T>({
    className,
    optionsClassName,
    options,
    placeholder = "Select value",
    value,
    optionsDirection = PopoverDirection.Horizontal,
    offset = 4,
    open = false,
    disabled = false,
    showValueInButton = false,
    hideChevron = false,
    onChange,
    onCancel,
}: Props<T>) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);

    function openOptions() {
        setIsOpen(true);
    }

    function handleCancel() {
        setIsOpen(false);
        onCancel?.();
    }

    function handleOptionClick(newValue: T) {
        setIsOpen(false);
        onChange(newValue);
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    function renderValue() {
        const selectedOption = value && options.find(({ value: optionValue }) => optionValue === value);
        if (showValueInButton && selectedOption) {
            return <div className={classes.label} title={selectedOption.label}>{selectedOption.label}</div>;
        }

        return (
            <Tooltip content={selectedOption ? selectedOption.label : undefined} followCursor>
                <div className={classes.placeholder}>{placeholder}</div>
            </Tooltip>
        );
    }

    const selectedOption = value && options.find(({ value: optionValue }) => optionValue === value);
    const hasValue = selectedOption !== undefined;
    const cls = classNames(classes.dropdown, className, {
        [classes.disabled]: disabled,
        [classes.open]: isOpen,
        [classes.hasValue]: hasValue,
        [classes.valueShown]: showValueInButton,
    });

    let chevronColor = "var(--label-secondary-color)";
    if (disabled) {
        chevronColor = "var(--label-secondary-disabled-color)";
    } else if (!showValueInButton && hasValue) {
        chevronColor = "var(--label-selected-color)";
    }

    return (
        <button
            ref={dropdownRef}
            type="button"
            className={cls}
            onClick={disabled ? undefined : openOptions}>
            {renderValue()}
            {!hideChevron && <IconChevronDown color={chevronColor}/>}
            {isOpen && isRendered && (
                <Popover
                    direction={optionsDirection}
                    anchor={dropdownRef.current!}
                    offset={offset}
                    onClose={handleCancel}
                    onCancel={handleCancel}>
                    <Options
                        className={optionsClassName}
                        options={options}
                        value={value}
                        onOptionClick={handleOptionClick}/>
                </Popover>
            )}
        </button>
    );
}

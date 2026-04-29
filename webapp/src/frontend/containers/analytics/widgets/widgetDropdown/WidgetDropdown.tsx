import { type MouseEvent, useEffect, useRef, useState } from "react";

import classNames from "classnames";

import { Keyboard } from "../../../../enums";
import { type DropdownOption } from "../../../../library/Dropdown/DropdownOption";
import { PopoverDirection, Popover } from "../../../../library/Popover/Popover";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";
import { scrollIntoViewIfNecessary } from "../../../../utils";

import classes from "./WidgetDropdown.module.css";

interface OptionsProps<T> {
    options: DropdownOption<T>[];
    value: T;
    onChange(newValue: T): void;
}

function Options<T>({
    options,
    value,
    onChange,
}: OptionsProps<T>) {
    const focusedOptionsRef = useRef<HTMLDivElement>(null);
    const [focusedOption, setFocusedOption] = useState<T | null>(null);

    function handleOptionMouseMove(value: T) {
        setFocusedOption(value);
    }

    function handleOptionClick(event: MouseEvent<HTMLDivElement>, newValue: T) {
        event.stopPropagation();
        onChange(newValue);
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.ArrowDown:
                event.preventDefault();
                if (focusedOption === null) {
                    setFocusedOption(options[0].value);
                } else {
                    const focusedOptionIndex = options.findIndex(({ value }) => value === focusedOption);
                    setFocusedOption(options[(focusedOptionIndex + 1) % options.length].value);
                }
                break;

            case Keyboard.Code.ArrowUp:
                event.preventDefault();
                if (focusedOption === null) {
                    setFocusedOption(options[options.length - 1].value);
                } else {
                    const focusedOptionIndex = options.findIndex(({ value }) => value === focusedOption);
                    setFocusedOption(options[(focusedOptionIndex - 1 + options.length) % options.length].value);
                }
                break;

            case Keyboard.Code.Enter:
            case Keyboard.Code.Space:
                event.preventDefault();
                if (focusedOption) {
                    onChange(focusedOption);
                }
                break;
        }
    }
    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [focusedOption]);

    useEffect(() => {
        if (focusedOptionsRef.current) {
            scrollIntoViewIfNecessary(focusedOptionsRef.current, 4);
        }
    }, [focusedOptionsRef.current]);

    return (
        <div className={classes.options}>
            {options.map(({ value: optionValue, label }) => {
                const hovered = optionValue === focusedOption;
                const className = classNames(classes.option, {
                    [classes.selected]: optionValue === value,
                    [classes.hover]: hovered,
                });

                return (
                    <div
                        key={String(optionValue)}
                        ref={hovered ? focusedOptionsRef : undefined}
                        className={className}
                        tabIndex={0}
                        onMouseMove={() => handleOptionMouseMove(optionValue)}
                        onClick={ev => handleOptionClick(ev, optionValue)}>
                        <span className={classes.optionLabel} title={label}>{label}</span>
                    </div>
                );
            })}
        </div>
    );
}

interface Props<T> {
    type?: WidgetDropdownType;
    className?: string;
    options: DropdownOption<T>[];
    optionsOffset?: number;
    placeholder?: string;
    value?: T;
    defaultValue?: T;
    optionsDirection?: PopoverDirection;
    open?: boolean;
    disabled?: boolean;
    onChange(value: T): void;
    onCancel?: () => void;
}

export enum WidgetDropdownType {
    Minimal = "minimal",
    Default = "default",
}

const OPTIONS_OFFSET = 16;

export function WidgetDropdown<T>({
    type = WidgetDropdownType.Default,
    className,
    options,
    optionsOffset = OPTIONS_OFFSET,
    placeholder = "Select value",
    value,
    defaultValue,
    optionsDirection = PopoverDirection.Horizontal,
    open = false,
    disabled = false,
    onChange,
    onCancel,
}: Props<T>) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
        onCancel?.();
    }

    function handleChange(newValue: T) {
        setIsOpen(false);

        if (newValue !== value) {
            onChange(newValue);
        } else {
            onCancel?.();
        }
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    function renderValue() {
        const selectedOption = options.find(({ value: optionValue }) => optionValue === value);

        if (selectedOption) {
            const className = classNames(classes.selectedOption, {
                [classes.default]: selectedOption.value === defaultValue,
            });

            return <div className={className}>{selectedOption.label}</div>;
        }

        return <div className={classes.placeholder}>{placeholder}</div>;
    }

    const cls = classNames(classes.widgetDropdown, className, {
        [classes.minimal]: type === WidgetDropdownType.Minimal,
        [classes.disabled]: disabled,
        [classes.open]: isOpen,
    });

    return (
        <div
            ref={dropdownRef}
            className={cls}
            onClick={disabled ? undefined : openOptions}>
            <Tooltip content={disabled ? "Ask to join workspace to edit" : undefined} followCursor>
                {renderValue()}
            </Tooltip>
            {isOpen && isRendered && (
                <Popover
                    direction={optionsDirection}
                    anchor={dropdownRef.current!}
                    offset={optionsOffset}
                    onClose={closeOptions}
                    onCancel={closeOptions}>
                    <Options
                        options={options}
                        value={value}
                        onChange={handleChange}/>
                </Popover>
            )}
        </div>
    );
}

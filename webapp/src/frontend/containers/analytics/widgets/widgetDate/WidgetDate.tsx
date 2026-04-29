import { type MouseEvent, useEffect, useRef, useState } from "react";

import classNames from "classnames";

import { getDateOptionLabel, isDateOption, DateOption } from "../../../../../common/models/DateOption";
import { Keyboard } from "../../../../enums";
import { PopoverDirection, Popover } from "../../../../library/Popover/Popover";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";
import { formatDate, isValidDate, toISODateString } from "../../../../utils";

import classes from "./WidgetDate.module.css";

interface OptionsProps {
    value: string;
    defaultValue: string;
    allowEmptyValue: boolean;
    onChange: (value: string) => void;
}
const CUSTOM_OPTION = "custom";
function Options({
    value,
    defaultValue,
    allowEmptyValue,
    onChange,
}: OptionsProps) {
    const options = allowEmptyValue ? [...Object.values(DateOption), "", CUSTOM_OPTION] : [...Object.values(DateOption), CUSTOM_OPTION];
    const inputRef = useRef<HTMLInputElement>(null);
    const [focusedOption, setFocusedOption] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const isCustomSelected = value !== null && isValidDate(value);
    const customValue = isCustomSelected ? toISODateString(value) : undefined;

    useEffect(() => {
        if (!inputRef.current) {
            return;
        }

        function handleCustomInputChange(e: Event) {
            e.stopPropagation();

            const inputValue = (e.currentTarget as EventTarget & HTMLInputElement).value;
            const newValue = inputValue ? `${inputValue}T00:00:00` : defaultValue;

            onChange(newValue);
        }

        inputRef.current.addEventListener("change", handleCustomInputChange);

        return () => {
            inputRef.current?.removeEventListener("change", handleCustomInputChange);
        };
    }, [inputRef.current]);

    function handleOptionClick(newValue: string) {
        return (event: MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();
            onChange(newValue);
        };
    }

    function handleCustomOptionClick(event: MouseEvent<HTMLLabelElement>) {
        event.stopPropagation();

        if (!inputRef.current || !("showPicker" in inputRef.current)) {
            return;
        }

        (inputRef.current as { showPicker(): void; }).showPicker();
        setIsPickerOpen(true);
    }

    function handleOptionMouseMove(focusedValue: string) {
        return () => {
            setFocusedOption(focusedValue);
        };
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            switch (event.code) {
                case Keyboard.Code.ArrowDown:
                    event.preventDefault();
                    if (focusedOption === null) {
                        setFocusedOption(options[0]);
                    } else {
                        const focusedOptionIndex = options.findIndex((v) => v === focusedOption);
                        setFocusedOption(options[(focusedOptionIndex + 1) % options.length]);
                    }
                    break;

                case Keyboard.Code.ArrowUp:
                    event.preventDefault();
                    if (focusedOption === null) {
                        setFocusedOption(options[options.length - 1]);
                    } else {
                        const focusedOptionIndex = options.findIndex((v) => v === focusedOption);
                        setFocusedOption(options[(focusedOptionIndex - 1 + options.length) % options.length]);
                    }
                    break;

                case Keyboard.Code.Enter:
                case Keyboard.Code.Space:
                    event.preventDefault();
                    if (!focusedOption) {
                        break;
                    }
                    if (focusedOption !== CUSTOM_OPTION) {
                        onChange(focusedOption);
                        break;
                    }
                    if (!inputRef.current) {
                        break;
                    }
                    inputRef.current.click();
                    break;
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [focusedOption, inputRef.current, value]);

    const classCustomOption = classNames(
        classes.option,
        {
            [classes.selected]: isValidDate(value),
            [classes.active]: isPickerOpen,
            [classes.hover]: focusedOption === "custom",
        },
    );

    const classEmptyOption = classNames(
        classes.option,
        {
            [classes.selected]: value === "",
            [classes.hover]: focusedOption === "",
        }
    );

    return (
        <div className={classes.options}>
            {Object.values(DateOption).map(dateOption => {
                const cls = classNames(
                    classes.option,
                    {
                        [classes.selected]: value === dateOption,
                        [classes.hover]: focusedOption === dateOption,
                    },
                );
                return (
                    <div
                        key={dateOption}
                        className={cls}
                        onClick={handleOptionClick(dateOption)}
                        onMouseMove={handleOptionMouseMove(dateOption)}>
                        {getDateOptionLabel(dateOption)}
                    </div>
                );
            })}
            {allowEmptyValue && (
                <div
                    className={classEmptyOption}
                    onClick={handleOptionClick("")}
                    onMouseMove={handleOptionMouseMove("")}>
                    Dawn of time
                </div>
            )}
            <label className={classCustomOption} onClick={handleCustomOptionClick} onMouseMove={handleOptionMouseMove("custom")}>
                Custom…
                <input
                    type="date"
                    ref={inputRef}
                    defaultValue={customValue}
                    max={toISODateString(new Date())}/>
            </label>
        </div>
    );
}

interface Props {
    className?: string;
    value: string;
    defaultValue: string;
    allowEmptyValue?: boolean;
    disabled?: boolean;
    onChange(value: string): void;
}

function formatValue(value: string): string {
    if (!value) {
        return "Dawn of time";
    }
    if (isDateOption(value)) {
        return getDateOptionLabel(value);
    }
    const date = new Date(value);
    return isValidDate(date) ? formatDate(date) : "";
}

export function WidgetDate({
    className,
    value,
    defaultValue,
    allowEmptyValue = false,
    disabled = false,
    onChange,
}: Props) {
    const widgetRef = useRef<HTMLButtonElement>(null);
    const [isRendered, setIsRendered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
    }

    useEffect(() => {
        setIsRendered(Boolean(widgetRef.current));
    }, [widgetRef.current]);

    function handleChange(v: string) {
        setIsOpen(false);
        onChange(v);
    }

    const cls = classNames(
        classes.widgetDate,
        {
            [classes.disabled]: disabled,
            [classes.default]: value === defaultValue,
            [classes.open]: isOpen,
        },
        className
    );
    return (
        <button
            ref={widgetRef}
            className={cls}
            onClick={disabled ? undefined : openOptions}>
            <Tooltip content={disabled ? "Ask to join workspace to edit" : undefined} followCursor>
                {formatValue(value)}
            </Tooltip>
            {isOpen && isRendered && (
                <Popover
                    anchor={widgetRef.current!}
                    offset={4}
                    direction={PopoverDirection.Horizontal}
                    onClose={closeOptions}
                    onCancel={closeOptions}>
                    <Options
                        value={value}
                        defaultValue={defaultValue}
                        allowEmptyValue={allowEmptyValue}
                        onChange={handleChange}/>
                </Popover>
            )}
        </button>
    );
}

import {
    type MouseEvent,
    type ReactNode,
    useEffect,
    useRef,
    useState,
} from "react";

import classNames from "classnames";

import { getDateOptionLabel, isDateOption, DateOption } from "../../../../common/models/DateOption";
import { Keyboard } from "../../../enums";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconRemove } from "../../../library/icons/IconRemove";
import { PopoverDirection, Popover } from "../../../library/Popover/Popover";
import { formatDate, isValidDate, toISODateString } from "../../../utils";

import classes from "./DropdownDate.module.css";

interface OptionsProps {
    value: string | null;
    onChange(value: string | null): void;
}
const CUSTOM_OPTION = "custom";
const OPTIONS = [...Object.values(DateOption), CUSTOM_OPTION];

function Options({
    value,
    onChange,
}: OptionsProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const focusedOptionRef = useRef<HTMLDivElement>(null);
    const [focusedOption, setFocusedOption] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const isCustomSelected = value !== null && isValidDate(value);
    const customValue = isCustomSelected ? toISODateString(value) : undefined;

    function handleOptionMouseMove(focusedValue: string) {
        return () => {
            setFocusedOption(focusedValue);
        };
    }

    function handleOptionClick(newValue: string) {
        return (event: MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();
            onChange(newValue === value ? null : newValue);
        };
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            switch (event.code) {
                case Keyboard.Code.ArrowDown:
                    event.preventDefault();
                    if (focusedOption === null) {
                        setFocusedOption(OPTIONS[0]);
                    } else {
                        const focusedOptionIndex = OPTIONS.findIndex(option => option === focusedOption);
                        setFocusedOption(OPTIONS[(focusedOptionIndex + 1) % OPTIONS.length]);
                    }
                    break;

                case Keyboard.Code.ArrowUp:
                    event.preventDefault();
                    if (focusedOption === null) {
                        setFocusedOption(OPTIONS[OPTIONS.length - 1]);
                    } else {
                        const focusedOptionIndex = OPTIONS.findIndex(option => option === focusedOption);
                        setFocusedOption(OPTIONS[(focusedOptionIndex - 1 + OPTIONS.length) % OPTIONS.length]);
                    }
                    break;

                case Keyboard.Code.Space:
                case Keyboard.Code.Enter:
                    event.preventDefault();
                    if (!focusedOption) {
                        onChange(null);
                        break;
                    }
                    focusedOptionRef.current?.click();
                    break;
            }
        }
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [focusedOption]);

    useEffect(() => {
        if (!inputRef.current) {
            return;
        }

        function handleCustomInputChange(e: Event) {
            e.stopPropagation();
            const newValue = `${(e.currentTarget as EventTarget & HTMLInputElement).value}T00:00:00`;
            onChange(newValue === value ? null : newValue);
        }

        inputRef.current.addEventListener("change", handleCustomInputChange);

        return () => {
            inputRef.current?.removeEventListener("change", handleCustomInputChange);
        };
    }, [inputRef.current]);

    function handleCustomOptionClick(event: MouseEvent<HTMLLabelElement>) {
        event.stopPropagation();

        if (isCustomSelected) {
            onChange(null);
            return;
        }

        if (!inputRef.current || !("showPicker" in inputRef.current)) {
            return;
        }

        (inputRef.current as { showPicker(): void; }).showPicker();
        setIsPickerOpen(true);
    }

    const classCustomOption = classNames(
        classes.option,
        {
            [classes.selected]: isCustomSelected,
            [classes.active]: isPickerOpen,
            [classes.hover]: focusedOption === "custom",
        },
    );

    return (
        <div className={classes.options}>
            <div className={classNames(classes.title)}>
                Since
            </div>
            {Object.values(DateOption).map((dateOption) => {
                const isFocused = dateOption === focusedOption;
                const className = classNames(classes.option, {
                    [classes.selected]: dateOption === value,
                    [classes.hover]: isFocused,
                });
                return (
                    <div
                        ref={isFocused ? focusedOptionRef : null}
                        key={dateOption}
                        className={className}
                        onClick={handleOptionClick(dateOption)}
                        onMouseMove={handleOptionMouseMove(dateOption)}>
                        {getDateOptionLabel(dateOption)}
                    </div>
                );
            })}
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


function formatValue(value: string): string {
    if (isDateOption(value)) {
        return getDateOptionLabel(value);
    }
    const date = new Date(value);
    return isValidDate(date) ? formatDate(date) : "";
}

function isValidOption(value: string | null): value is string {
    return value !== null && (isDateOption(value) || isValidDate(value));
}

interface Props {
    className?: string;
    icon?: ReactNode;
    label: string;
    optionsOffset?: number;
    placeholder?: string;
    value: string | null;
    optionsDirection?: PopoverDirection;
    open?: boolean;
    onChange(value: string | null): void;
    onClose?(): void;
}

const OPTIONS_OFFSET = 8;
export function DropdownDate({
    className,
    icon,
    label,
    optionsOffset = OPTIONS_OFFSET,
    value,
    optionsDirection = PopoverDirection.Vertical,
    open = false,
    onChange,
    onClose,
}: Props) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);

    const hasValue = isValidOption(value);

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
        onClose?.();
    }

    function handleChange(v: string | null) {
        onChange(v);
        closeOptions();
    }

    function handleRemove() {
        onChange(null);
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    function renderMainLabel() {
        return <span className={classes.mainLabel}>{icon}{label}{hasValue ? ":" : ""}</span>;
    }

    function renderLabel() {
        if (!hasValue) {
            return renderMainLabel();
        }

        return (
            <span className={classes.label}>
                {renderMainLabel()}
                {formatValue(value)}
            </span>
        );
    }
    const cls = classNames(classes.dropdownDate, className, {
        [classes.open]: isOpen,
    });

    return (
        <div className={classes.dropdownDateContainer}>
            <button
                ref={dropdownRef}
                className={cls}
                onClick={openOptions}>
                {renderLabel()} <IconChevronDown color="var(--label-secondary-color)"/>
                {isOpen && isRendered && (
                    <Popover
                        anchor={dropdownRef.current!}
                        offset={optionsOffset}
                        direction={optionsDirection}
                        onClose={closeOptions}
                        onCancel={closeOptions}>
                        <Options value={value} onChange={handleChange}/>
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

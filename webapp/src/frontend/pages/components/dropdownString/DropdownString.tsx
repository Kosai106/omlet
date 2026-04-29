import { type FormEvent, useEffect, useRef, useState } from "react";

import classNames from "classnames";

import {
    type StringFilterOperation,
    FilterOperation,
    stringFilterOperations,
    getFilterOperationLabel,
} from "../../../../common/models/FilterOperation";
import { Dropdown } from "../../../library/Dropdown/Dropdown";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconRemove } from "../../../library/icons/IconRemove";
import { Popover, PopoverDirection } from "../../../library/Popover/Popover";
import { type TextInputHandle, TextInput } from "../../../library/TextInput/TextInput";
import { isValidRegex } from "../../../utils";

import classes from "./DropdownString.module.css";

interface Props {
    className?: string;
    label: string;
    operation?: StringFilterOperation;
    value?: string;
    placeholder?: string;
    open?: boolean;
    onChange(operation: StringFilterOperation, value: string): void;
    onClose?(): void;
}

export function DropdownString({
    className,
    label,
    operation: initialOperation = FilterOperation.Contains,
    value: initialValue = "",
    placeholder = "Type a text",
    open = false,
    onChange,
    onClose,
}: Props) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<TextInputHandle>(null);

    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [operation, setOperation] = useState(initialOperation);
    const [hasError, setHasError] = useState(false);

    const stringOptions = stringFilterOperations.map(operation => ({
        value: operation,
        label: getFilterOperationLabel(operation),
    }));

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
        onClose?.();
    }

    function checkError(op: StringFilterOperation, val: string) {
        setHasError(op === FilterOperation.Regex && !isValidRegex(val.trim()));
    }

    function handleOperationChange(op: StringFilterOperation) {
        checkError(op, value);
        setOperation(op);

        inputRef.current?.focus();
    }

    function handleChange(val: string) {
        checkError(operation, val);
        setValue(val);
    }

    function handleFormSubmit(event: FormEvent) {
        event.preventDefault();

        handleSubmit();
    }

    function handleSubmit() {
        if (hasError) {
            setValue(initialValue);
            setOperation(initialOperation);
            checkError(initialOperation, initialValue);
        } else {
            onChange(operation, value.trim());
        }

        closeOptions();
    }

    function handleCancel() {
        setValue(initialValue);
        setOperation(initialOperation);
        onChange(initialOperation, initialValue);
        closeOptions();
    }

    function handleRemove() {
        onChange(operation, "");
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    useEffect(() => {
        setOperation(initialOperation);
    }, [initialOperation]);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    function renderLabel() {
        if (!initialValue) {
            return label;
        }

        const value = initialOperation === FilterOperation.Regex
            ? `/${initialValue}/`
            : <><span className={classes.operation}>{getFilterOperationLabel(initialOperation)}</span> {initialValue}</>;

        return (
            <span>
                {label}: {value}
            </span>
        );
    }

    const cls = classNames(classes.dropdownString, className, {
        [classes.open]: isOpen,
    });

    return (
        <div className={classes.dropdownStringContainer}>
            <button
                ref={dropdownRef}
                className={cls}
                onClick={openOptions}>
                {renderLabel()}
                <IconChevronDown color="var(--label-secondary-color)"/>
                {isOpen && isRendered && (
                    <Popover
                        anchor={dropdownRef.current!}
                        className={classes.dropdownStringPopover}
                        direction={PopoverDirection.Vertical}
                        onClose={handleSubmit}
                        onCancel={handleCancel}>
                        <form className={classes.form} onSubmit={handleFormSubmit}>
                            <Dropdown
                                options={stringOptions}
                                value={operation}
                                optionsDirection={PopoverDirection.Vertical}
                                offset={0}
                                showValueInButton
                                hideChevron
                                onChange={handleOperationChange}/>
                            <TextInput
                                ref={inputRef}
                                className={classNames(classes.stringInput, { [classes.error]: hasError })}
                                value={value}
                                placeholder={operation === FilterOperation.Regex ? "Type a regex" : placeholder}
                                maxLength={100}
                                autoFocus
                                onChange={handleChange}
                                onCancel={handleCancel}/>
                            <input className={classes.hiddenInput} type="submit"/>
                        </form>
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

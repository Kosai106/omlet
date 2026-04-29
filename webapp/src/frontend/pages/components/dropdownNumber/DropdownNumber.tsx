import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";

import classNames from "classnames";

import { FilterDataType } from "../../../../common/models/FilterDataType";
import {
    type NumberFilterOperation,
    FilterOperation,
    numberFilterOperations,
    getFilterOperationLabel,
} from "../../../../common/models/FilterOperation";
import { Dropdown } from "../../../library/Dropdown/Dropdown";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconRemove } from "../../../library/icons/IconRemove";
import { type NumberInputHandle, NumberInput } from "../../../library/NumberInput/NumberInput";
import { Popover, PopoverDirection } from "../../../library/Popover/Popover";

import classes from "./DropdownNumber.module.css";

interface Props {
    className?: string;
    icon?: ReactNode;
    label: string;
    operation?: NumberFilterOperation;
    value?: number;
    open?: boolean;
    onChange(operation: NumberFilterOperation, value: number | undefined): void;
    onClose?(): void;
}

export function DropdownNumber({
    className,
    icon,
    label,
    operation: initialOperation = FilterOperation.GreaterThan,
    value: initialValue,
    open = false,
    onChange,
    onClose,
}: Props) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<NumberInputHandle>(null);

    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [operation, setOperation] = useState(initialOperation);

    const numericOptions = numberFilterOperations.map(operation => ({
        value: operation,
        label: getFilterOperationLabel(operation, FilterDataType.Number),
    }));

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
        onClose?.();
    }

    function handleOperationChange(op: NumberFilterOperation) {
        setOperation(op);

        inputRef.current?.focus();
    }

    function handleChange(val: number) {
        setValue(val);
    }

    function handleFormSubmit(event: FormEvent) {
        event.preventDefault();

        handleSubmit();
    }

    function handleSubmit() {
        onChange(operation, value);
        closeOptions();
    }

    function handleCancel() {
        setValue(initialValue);
        setOperation(initialOperation);
        onChange(initialOperation, initialValue);
        closeOptions();
    }

    function handleRemove() {
        onChange(operation, undefined);
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

    function renderMainLabel() {
        return <span className={classes.mainLabel}>{icon}{label}</span>;
    }

    function renderLabel() {
        if (initialValue === undefined) {
            return renderMainLabel();
        }

        return (
            <span className={classes.label}>
                {renderMainLabel()}
                <span className={classes.operation}>{getFilterOperationLabel(initialOperation, FilterDataType.Number)}</span>
                {initialValue}
            </span>
        );
    }

    const cls = classNames(classes.dropdownNumber, className, {
        [classes.open]: isOpen,
    });

    return (
        <div className={classes.dropdownNumberContainer}>
            <button
                ref={dropdownRef}
                className={cls}
                onClick={openOptions}>
                {renderLabel()}
                <IconChevronDown color="var(--label-secondary-color)"/>
                {isOpen && isRendered && (
                    <Popover
                        anchor={dropdownRef.current!}
                        className={classes.dropdownNumberPopover}
                        direction={PopoverDirection.Vertical}
                        onClose={handleSubmit}
                        onCancel={handleCancel}>
                        <form className={classes.form} onSubmit={handleFormSubmit}>
                            <Dropdown
                                options={numericOptions}
                                value={operation}
                                optionsDirection={PopoverDirection.Vertical}
                                offset={0}
                                showValueInButton
                                hideChevron
                                onChange={handleOperationChange}/>
                            <NumberInput
                                ref={inputRef}
                                className={classes.numberInput}
                                value={value}
                                placeholder="Type a number"
                                autoFocus
                                onChange={handleChange}/>
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

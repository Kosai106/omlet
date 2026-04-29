import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import classNames from "classnames";

import classes from "./NumberInput.module.css";

interface Props {
    className?: string;
    value?: number;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    autoFocus?: boolean;
    autoSelect?: boolean;
    disabled?: boolean;
    required?: boolean;
    onBlur?(): void;
    onChange(value: number | undefined): void;
}

export interface NumberInputHandle {
    focus(): void;
}

export const NumberInput = forwardRef<NumberInputHandle, Props>((
    {
        className,
        value,
        placeholder = "",
        min = 0,
        max = Number.MAX_SAFE_INTEGER,
        step = 1,
        autoFocus = false,
        autoSelect = false,
        disabled = false,
        required = false,
        onBlur,
        onChange,
    },
    ref,
) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => {
        return {
            focus() {
                inputRef.current?.focus();
            },
        };
    }, []);

    useEffect(() => {
        if (autoSelect) {
            inputRef.current?.focus();
            inputRef.current?.select();
        } else if (autoFocus) {
            inputRef.current?.focus();
        }
    }, [autoFocus, autoSelect]);

    function getValidatedValue(): number | undefined {
        const input = inputRef.current!;

        if (input.value === "" || !input.validity.valid) {
            return undefined;
        }

        if (min >= 0 && input.value === "-") {
            return undefined;
        }

        return input.valueAsNumber;
    }

    function handleChange() {
        onChange(getValidatedValue());
    }

    return (
        <input
            ref={inputRef}
            type="number"
            className={classNames(classes.numberInput, className)}
            value={value ?? ""}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            required={required}
            onBlur={onBlur}
            onChange={handleChange}/>
    );
});

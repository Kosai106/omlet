import { type ChangeEvent, type FormEvent, forwardRef, type KeyboardEvent, useEffect, useRef, useState, useImperativeHandle } from "react";

import classNames from "classnames";

import { Keyboard } from "../../enums";

import classes from "./NinjaInput.module.css";

interface Props {
    className?: string;
    value?: string;
    placeholder: string;
    maxLength?: number;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    autoFocus?: boolean;
    autoSelect?: boolean;
    onInput?(value: string): void;
    onChange?(value: string): void;
}

export interface NinjaInputHandle {
    focus(): void;
    select(): void;
}

export const NinjaInput = forwardRef<NinjaInputHandle, Props>(({
    className,
    value: initialValue = "",
    placeholder,
    maxLength,
    required = false,
    disabled = false,
    readOnly = false,
    autoFocus = false,
    autoSelect = false,
    onInput,
    onChange,
},
ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState(initialValue);

    useImperativeHandle(ref, () => {
        return {
            focus() {
                inputRef.current?.focus();
            },
            select() {
                inputRef.current?.focus();
                inputRef.current?.select();
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

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    function handleBlur() {
        if (required && value === "") {
            setValue(initialValue);
        } else if (value !== initialValue) {
            onChange?.(value.trim());
            setValue(value.trim());
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.code === Keyboard.Code.Enter) {
            event.stopPropagation();
            inputRef.current?.blur();
        } else if (event.code === Keyboard.Code.Escape) {
            event.stopPropagation();
            setValue(initialValue);
            window.setTimeout(() => inputRef.current?.blur(), 0);
        }
    }

    function handleInput(event: FormEvent<HTMLInputElement>) {
        onInput?.(event.currentTarget.value);
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setValue(event.currentTarget.value);
    }

    return (
        <div className={classNames(classes.ninjaInputContainer, className)}>
            <div className={classes.mirror}>{value || placeholder || " "}</div>
            <input
                ref={inputRef}
                type="text"
                className={classes.ninjaInput}
                value={value}
                placeholder={placeholder}
                maxLength={maxLength}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                spellCheck={false}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onChange={handleChange}/>
        </div>
    );
});

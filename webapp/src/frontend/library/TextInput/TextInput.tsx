import { type ChangeEvent, type KeyboardEvent, useEffect, useRef, forwardRef, useImperativeHandle } from "react";

import classNames from "classnames";

import { Keyboard } from "../../enums";

import classes from "./TextInput.module.css";

interface Props {
    className?: string;
    value?: string;
    placeholder?: string;
    maxLength?: number;
    autoFocus?: boolean;
    autoSelect?: boolean;
    disabled?: boolean;
    required?: boolean;
    onBlur?(): void;
    onChange(value: string): void;
    onCancel?(): void;
}

export interface TextInputHandle {
    focus(): void;
    select(): void;
}

export const TextInput = forwardRef<TextInputHandle, Props>((
    {
        className,
        value = "",
        placeholder = "",
        maxLength,
        autoFocus = false,
        autoSelect = false,
        disabled = false,
        required = false,
        onBlur,
        onChange,
        onCancel,
    },
    ref,
) => {
    const inputRef = useRef<HTMLInputElement>(null);

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

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        onChange(event.currentTarget.value);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        switch (event.code) {
            case Keyboard.Code.Escape:
                event.stopPropagation();
                onCancel?.();
                break;
        }
    }

    return (
        <input
            ref={inputRef}
            type="text"
            className={classNames(classes.textInput, className)}
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            required={required}
            spellCheck={false}
            onBlur={onBlur}
            onChange={handleChange}
            onKeyDown={handleKeyDown}/>
    );
});

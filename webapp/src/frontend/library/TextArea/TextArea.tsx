import { type ChangeEvent, type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";

import classNames from "classnames";

import { Keyboard } from "../../enums";

import classes from "./TextArea.module.css";

interface Props {
    className?: string;
    value?: string;
    placeholder?: string;
    maxLength?: number;
    disabled?: boolean;
    autoFocus?: boolean;
    autoSelect?: boolean;
    submitOnEnter?: boolean;
    onInput?(value: string): void;
    onChange?(value: string): void;
}

export function TextArea({
    className,
    value: initialValue = "",
    placeholder = "",
    maxLength,
    disabled = false,
    autoFocus = false,
    autoSelect = false,
    submitOnEnter = false,
    onInput,
    onChange,
}: Props) {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (autoSelect) {
            textAreaRef.current?.focus();
            textAreaRef.current?.select();
        } else if (autoFocus) {
            textAreaRef.current?.focus();
        }
    }, [autoFocus, autoSelect]);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    function handleBlur() {
        if (value !== initialValue) {
            onChange?.(value);
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.code === Keyboard.Code.Enter) {
            event.stopPropagation();
            event.preventDefault();
            textAreaRef.current?.form?.requestSubmit();
        }
    }

    function handleInput(event: FormEvent<HTMLTextAreaElement>) {
        onInput?.(event.currentTarget.value);
    }

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setValue(event.currentTarget.value);
    }

    return (
        <textarea
            ref={textAreaRef}
            className={classNames(classes.textArea, className)}
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            spellCheck={false}
            onBlur={handleBlur}
            onKeyDown={submitOnEnter ? handleKeyDown : undefined}
            onInput={handleInput}
            onChange={handleChange}/>
    );
}

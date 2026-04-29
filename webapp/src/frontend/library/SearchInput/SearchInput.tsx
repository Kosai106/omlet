import { type ChangeEvent, type KeyboardEvent, type FocusEvent, useRef, useState, useEffect } from "react";

import classNames from "classnames";

import { Keyboard } from "../../enums";
import { IconSearch } from "../icons/IconSearch";

import classes from "./SearchInput.module.css";

interface Props {
    className?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    onFocus?(event: FocusEvent<HTMLInputElement>): void;
    onSearch(term: string): void;
}

const SEARCH_TIMEOUT_DELAY = 400;

export function SearchInput({
    className = "",
    value: initialValue = "",
    placeholder = "Search",
    disabled = false,
    onFocus,
    onSearch,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState(initialValue);
    const searchTimeout = useRef<number>();

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setValue(event.target.value);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        event.stopPropagation();

        if (value) {
            return;
        }

        if (event.code === Keyboard.Code.Escape) {
            inputRef.current?.blur();
        }
    }

    useEffect(() => {
        window.clearTimeout(searchTimeout.current);

        if (initialValue !== value) {
            searchTimeout.current = window.setTimeout(onSearch, SEARCH_TIMEOUT_DELAY, value);
        }
    }, [value]);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <label
            className={classNames(classes.searchInput, className, { [classes.disabled]: disabled })}>
            <IconSearch/>
            <input
                ref={inputRef}
                className={classes.input}
                type="search"
                value={value}
                placeholder={placeholder}
                spellCheck={false}
                disabled={disabled}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                onChange={handleChange}/>
        </label>
    );
}

import {
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    useEffect,
    useRef,
    useState,
} from "react";

import classNames from "classnames";

import { Keyboard } from "../../../enums";
import { type DropdownOption } from "../../../library/Dropdown/DropdownOption";
import { FilterPill } from "../../../library/FilterPill/FilterPill";
import { IconMetadata } from "../../../library/icons/IconMetadata";
import { IconSearch } from "../../../library/icons/IconSearch";
import { PopoverDirection, Popover } from "../../../library/Popover/Popover";
import { scrollIntoViewIfNecessary } from "../../../utils";

import classes from "./DropdownCustomProperty.module.css";

interface OptionsProps<T> {
    options: DropdownOption<T>[];
    onSelect(value: T): void;
}

function Options<T>({
    options,
    onSelect,
}: OptionsProps<T>) {
    const inputRef = useRef<HTMLInputElement>(null);
    const focusedOptionsRef = useRef<HTMLDivElement>(null);

    const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);
    const [visibleOptions, setVisibleOptions] = useState<DropdownOption<T>[]>(options);

    function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        switch (event.code) {
            case Keyboard.Code.Escape:
                if (event.currentTarget.value) {
                    event.stopPropagation();
                }
                break;
            case Keyboard.Code.Enter:
                event.stopPropagation();
                inputRef.current?.blur();
                setFocusedOptionIndex(0);
                break;
        }
    }

    function handleSearch(event: ChangeEvent<HTMLInputElement>) {
        const searchValue = event.target.value.trim();
        const filteredOptions = options.filter(({ label }) => label.toLowerCase().includes(searchValue.toLowerCase()));

        setFocusedOptionIndex(null);
        setVisibleOptions(filteredOptions);
    }

    function handleOptionMouseMove(index: number) {
        setFocusedOptionIndex(index);
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.ArrowDown:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOptionIndex === null) {
                    setFocusedOptionIndex(0);
                } else {
                    setFocusedOptionIndex((focusedOptionIndex + 1) % visibleOptions.length);
                }
                break;

            case Keyboard.Code.ArrowUp:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOptionIndex === null) {
                    setFocusedOptionIndex(visibleOptions.length);
                } else {
                    setFocusedOptionIndex((focusedOptionIndex - 1 + visibleOptions.length) % visibleOptions.length);
                }
                break;

            case Keyboard.Code.Space:
            case Keyboard.Code.Enter:
                if (focusedOptionIndex !== null) {
                    event.preventDefault();
                    onSelect(visibleOptions[focusedOptionIndex].value);
                }
                break;

            default:
                inputRef.current?.focus();
        }
    }

    useEffect(() => {
        if (focusedOptionsRef.current) {
            scrollIntoViewIfNecessary(focusedOptionsRef.current, 4);
        }
    }, [focusedOptionsRef.current]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [focusedOptionIndex, visibleOptions]);

    return (
        <div className={classes.optionsPopup}>
            <div className={classes.searchInput}>
                <IconSearch/>
                <input
                    ref={inputRef}
                    type="search"
                    placeholder="Search for property"
                    spellCheck={false}
                    autoFocus
                    onFocus={() => setFocusedOptionIndex(null)}
                    onKeyDown={handleInputKeyDown}
                    onChange={handleSearch}/>
            </div>
            <div className={classes.options}>
                {visibleOptions.map(({ label, value }, index) => {
                    const hovered = index === focusedOptionIndex;
                    const className = classNames(classes.option, {
                        [classes.hover]: hovered,
                    });

                    return (
                        <div
                            key={label}
                            ref={hovered ? focusedOptionsRef : undefined}
                            className={className}
                            onMouseMove={() => handleOptionMouseMove(index)}
                            onClick={() => onSelect(value)}>
                            <span className={classes.optionLabel} title={label}>{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface Props<T> {
    options: DropdownOption<T>[];
    onSelect(value: T): void;
}

export function DropdownCustomProperty<T>({
    options,
    onSelect,
}: Props<T>) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isRendered, setIsRendered] = useState(false);

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
    }

    function handleSelect(value: T) {
        onSelect(value);
        closeOptions();
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    return (
        <FilterPill
            ref={dropdownRef}
            active={isOpen}
            onClick={openOptions}>
            <IconMetadata/> Custom properties
            {isOpen && isRendered && (
                <Popover
                    anchor={dropdownRef.current!}
                    direction={PopoverDirection.Vertical}
                    onClose={closeOptions}
                    onCancel={closeOptions}>
                    <Options
                        options={options}
                        onSelect={handleSelect}/>
                </Popover>
            )}
        </FilterPill>
    );
}

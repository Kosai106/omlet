import {
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    useEffect,
    useRef,
    useState,
    useMemo,
} from "react";

import classNames from "classnames";

import { type Tag as TagModel, RESERVED_TAGS } from "../../../../common/models/Tag";
import { Keyboard } from "../../../enums";
import { Checkbox } from "../../../library/Checkbox/Checkbox";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconSearch } from "../../../library/icons/IconSearch";
import { PopoverDirection, Popover } from "../../../library/Popover/Popover";
import { Tooltip } from "../../../library/Tooltip/Tooltip";
import { scrollIntoViewIfNecessary } from "../../../utils";

import classes from "./DropdownTags.module.css";

const OPTIONS_OFFSET = 8;

interface OptionsProps {
    options: TagModel[];
    values: string[];
    onChange(values: string[]): void;
    onSubmit(): void;
}

function Options({
    options,
    values,
    onChange,
    onSubmit,
}: OptionsProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const focusedOptionsRef = useRef<HTMLLabelElement>(null);

    const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(null);
    const [visibleOptions, setVisibleOptions] = useState<TagModel[]>(options);

    const isSelectAllChecked = useMemo(() => {
        return visibleOptions
            .filter(visibleOption => visibleOption.slug !== RESERVED_TAGS.UNTAGGED.slug)
            .every(visibleOption => values.some(value => value === visibleOption.slug));
    }, [visibleOptions, values]);

    const isSelectAllIndeterminate = useMemo(() => {
        return visibleOptions.some(visibleOption => values.some(value => value === visibleOption.slug)) &&
            values[0] !== RESERVED_TAGS.UNTAGGED.slug &&
            !isSelectAllChecked;
    }, [visibleOptions, values, isSelectAllChecked]);

    function handleSelectAllChange() {
        if (isSelectAllChecked || isSelectAllIndeterminate) {
            onChange([]);
        } else {
            onChange(visibleOptions.map(({ slug }) => slug).filter(v => v !== RESERVED_TAGS.UNTAGGED.slug));
        }
    }

    function handleChange(value: string) {
        const selected = values.includes(value);

        if (selected) {
            onChange(values.filter(v => v !== value));
        } else if (value === RESERVED_TAGS.UNTAGGED.slug) {
            onChange([RESERVED_TAGS.UNTAGGED.slug]);
        } else {
            onChange([...values.filter(v => v !== RESERVED_TAGS.UNTAGGED.slug), value]);
        }
    }

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
        const searchValue = event.target.value.trim().toLowerCase();
        const filteredOptions = options.filter(({ name }) => name.toLowerCase().includes(searchValue));

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
                    setFocusedOptionIndex((focusedOptionIndex + 1) % (visibleOptions.length + 1));
                }
                break;

            case Keyboard.Code.ArrowUp:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOptionIndex === null) {
                    setFocusedOptionIndex(visibleOptions.length);
                } else {
                    setFocusedOptionIndex((focusedOptionIndex + visibleOptions.length) % (visibleOptions.length + 1));
                }
                break;

            case Keyboard.Code.Space:
                if (focusedOptionIndex === 0) {
                    event.preventDefault();
                    handleSelectAllChange();
                } else if (focusedOptionIndex !== null) {
                    event.preventDefault();
                    handleChange(visibleOptions[focusedOptionIndex - 1].slug);
                }
                break;

            case Keyboard.Code.Enter:
                onSubmit();
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
    }, [focusedOptionIndex, visibleOptions, values]);

    function renderSelectAllOption() {
        const index = 0;
        const hovered = focusedOptionIndex === index;
        const className = classNames(classes.option, {
            [classes.selected]: isSelectAllChecked,
            [classes.hover]: hovered,
        });

        return (
            <label
                key="Select all"
                ref={hovered ? focusedOptionsRef : undefined}
                onMouseMove={() => handleOptionMouseMove(index)}
                className={className}>
                <Checkbox
                    className={classes.optionCheckbox}
                    value="Select All"
                    checked={isSelectAllChecked}
                    indeterminate={isSelectAllIndeterminate}
                    onChange={handleSelectAllChange}/>
                <span className={classes.optionLabel} title="Select all">Select all</span>
            </label>
        );
    }

    return (
        <div className={classes.optionsPopup}>
            <div className={classes.searchInput}>
                <IconSearch/>
                <input
                    ref={inputRef}
                    type="search"
                    placeholder="Search"
                    spellCheck={false}
                    autoFocus
                    onFocus={() => setFocusedOptionIndex(null)}
                    onKeyDown={handleInputKeyDown}
                    onChange={handleSearch}/>
            </div>
            <div className={classes.options}>
                {renderSelectAllOption()}
                {visibleOptions.map(({ slug, name }, index) => {
                    const isUntaggedOption = slug === RESERVED_TAGS.UNTAGGED.slug;
                    const selected = values.includes(slug);
                    const hovered = index + 1 === focusedOptionIndex;
                    const className = classNames(classes.option, {
                        [classes.untaggedOption]: isUntaggedOption,
                        [classes.selected]: selected,
                        [classes.hover]: hovered,
                    });

                    return (
                        <label
                            key={slug}
                            ref={hovered ? focusedOptionsRef : undefined}
                            onMouseMove={() => handleOptionMouseMove(index + 1)}
                            className={className}>
                            <Checkbox
                                className={classes.optionCheckbox}
                                value={slug}
                                checked={selected}
                                onChange={handleChange}/>
                            <span className={classes.optionLabel} title={name}>{name}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

interface Props {
    className?: string;
    tags: TagModel[];
    values: string[];
    open?: boolean;
    disabled?: boolean;
    onChange(tagSlugs: string[]): void;
    onClose?(): void;
}

export function DropdownTags({
    className,
    tags,
    values,
    open = false,
    disabled = false,
    onChange,
    onClose,
}: Props) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(open);
    const [isRendered, setIsRendered] = useState(false);

    const [selectedValues, setSelectedValues] = useState<string[]>(values);
    const selectedOptions = tags.filter(({ slug }) => values.includes(slug)).map(({ name }) => name);

    function openOptions() {
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
        onClose?.();
    }

    function handleOptionsChange(values: string[]) {
        setSelectedValues(values);
    }

    function handleSubmit() {
        onChange(selectedValues);
        closeOptions();
    }

    function handleCancel() {
        setSelectedValues(values);
        onChange(values);
        closeOptions();
    }

    useEffect(() => {
        setIsRendered(Boolean(dropdownRef.current));
    }, [dropdownRef.current]);

    useEffect(() => {
        setSelectedValues(values);
    }, [values]);

    const hasValues = values.length > 0;
    const cls = classNames(classes.dropdownTags, className, {
        [classes.disabled]: disabled,
        [classes.open]: isOpen,
        [classes.hasValues]: hasValues,
    });

    const tooltipContent = !isOpen && selectedOptions.length > 0 ? selectedOptions.join("\n") : undefined;

    let chevronColor = "var(--label-secondary-color)";
    if (disabled) {
        chevronColor = "var(--label-secondary-disabled-color)";
    } else if (hasValues) {
        chevronColor = "var(--label-selected-color)";
    }

    return (
        <Tooltip content={tooltipContent}>
            <button
                ref={dropdownRef}
                className={cls}
                onClick={disabled ? undefined : openOptions}>
                Tag
                <IconChevronDown color={chevronColor}/>
                {isOpen && isRendered && (
                    <Popover
                        anchor={dropdownRef.current!}
                        direction={PopoverDirection.Vertical}
                        offset={OPTIONS_OFFSET}
                        onClose={handleSubmit}
                        onCancel={handleCancel}>
                        <Options
                            options={tags}
                            values={selectedValues}
                            onChange={handleOptionsChange}
                            onSubmit={handleSubmit}/>
                    </Popover>
                )}
            </button>
        </Tooltip>
    );
}

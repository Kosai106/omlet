import {
    type ChangeEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent,
    useEffect,
    useRef,
    useState,
    useMemo,
} from "react";

import classNames from "classnames";
import { Link, generatePath } from "react-router-dom";

import { type Tag as TagModel, getCoreTag, RESERVED_TAGS, getNonCoreTag } from "../../../../common/models/Tag";
import { RoutePath } from "../../../../common/RoutePath";
import { Keyboard } from "../../../enums";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { PopoverDirection, Popover } from "../../../library/Popover/Popover";
import { Radio } from "../../../library/Radio/Radio";
import { Tag } from "../../../library/Tag/Tag";
import { scrollIntoViewIfNecessary } from "../../../utils";

import classes from "./DropdownTags.module.css";

const OPTIONS_OFFSET = 8;

interface OptionsProps {
    options: TagModel[];
    workspaceSlug: string;
    value: TagModel;
    linksDisabled?: boolean;
    onChange(value: TagModel): void;
}

function Options({
    options,
    workspaceSlug,
    value,
    linksDisabled = false,
    onChange,
}: OptionsProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const focusedOptionRef = useRef<HTMLLabelElement>(null);
    const [focusedOption, setFocusedOption] = useState<TagModel | null>(null);
    const [visibleOptions, setVisibleOptions] = useState<TagModel[]>(options);

    const radioName = useMemo(() => window.crypto.randomUUID(), [JSON.stringify(options)]);

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
                setFocusedOption(visibleOptions[0] ?? null);
                break;
        }
    }

    function handleSearch(event: ChangeEvent<HTMLInputElement>) {
        const searchValue = event.target.value.trim();
        const filteredOptions = options.filter(({ name }) => name.toLowerCase().includes(searchValue.toLowerCase()));

        setFocusedOption(null);
        setVisibleOptions(filteredOptions);
    }

    function handleOptionMouseMove(value: TagModel) {
        setFocusedOption(value);
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.ArrowDown:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOption === null) {
                    setFocusedOption(visibleOptions[0] ?? null);
                } else {
                    const focusedOptionIndex = visibleOptions.findIndex(({ slug }) => slug === focusedOption.slug);
                    setFocusedOption(visibleOptions[(focusedOptionIndex + 1) % visibleOptions.length] ?? null);
                }
                break;

            case Keyboard.Code.ArrowUp:
                event.preventDefault();
                inputRef.current?.blur();
                if (focusedOption === null) {
                    setFocusedOption(visibleOptions[visibleOptions.length - 1] ?? null);
                } else {
                    const focusedOptionIndex = visibleOptions.findIndex(({ slug }) => slug === focusedOption.slug);
                    setFocusedOption(visibleOptions[(focusedOptionIndex - 1 + visibleOptions.length) % visibleOptions.length] ?? null);
                }
                break;

            case Keyboard.Code.Space:
            case Keyboard.Code.Enter:
                if (focusedOption) {
                    event.preventDefault();
                    onChange(focusedOption);
                }
                break;

            default:
                inputRef.current?.focus();
        }
    }

    useEffect(() => {
        if (focusedOptionRef.current) {
            scrollIntoViewIfNecessary(focusedOptionRef.current, 4);
        }
    }, [focusedOptionRef.current]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [focusedOption, visibleOptions, value]);

    return (
        <div className={classes.optionsPopup}>
            <div className={classes.searchInput}>
                <input
                    ref={inputRef}
                    type="search"
                    placeholder="Search tag"
                    spellCheck={false}
                    autoFocus
                    onFocus={() => setFocusedOption(null)}
                    onKeyDown={handleInputKeyDown}
                    onChange={handleSearch}/>
            </div>
            <div className={classes.options}>
                {visibleOptions.map(tag => {
                    const selected = value.slug === tag.slug;
                    const hovered = focusedOption?.slug === tag.slug;
                    const className = classNames(classes.option, {
                        [classes.selected]: selected,
                        [classes.hover]: hovered,
                    });

                    return (
                        <label
                            key={tag.slug}
                            ref={hovered ? focusedOptionRef : undefined}
                            onMouseMove={() => handleOptionMouseMove(tag)}
                            className={className}>
                            <Radio
                                className={classes.optionRadio}
                                name={radioName}
                                value={tag}
                                checked={selected}
                                onChange={onChange}/>
                            <Tag tag={tag} large/>
                        </label>
                    );
                })}
            </div>
            {!linksDisabled && (
                <div className={classes.optionsPopupFooter}>
                    <Link
                        className={classes.footerLink}
                        to={generatePath(RoutePath.Components, { workspaceSlug })}
                        state={{ fromApp: true }}>
                        Manage tags
                    </Link>
                </div>
            )}
        </div>
    );
}

interface Props {
    className?: string;
    workspaceSlug: string;
    tags: TagModel[];
    value: TagModel;
    linksDisabled?: boolean;
    onChange(tag: TagModel): void;
}

export function DropdownTags({
    className,
    workspaceSlug,
    tags,
    value,
    linksDisabled = false,
    onChange,
}: Props) {
    const dropdownRef = useRef<HTMLButtonElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isRendered, setIsRendered] = useState(false);

    const coreTag = getCoreTag(tags);
    const nonCoreTag = getNonCoreTag(coreTag);

    const reservedTagSlugs = Object.values(RESERVED_TAGS).map(({ slug }) => slug);
    const tagOptions = tags.filter(({ slug }) => !reservedTagSlugs.includes(slug));
    tagOptions.unshift(nonCoreTag);

    function openOptions(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        setIsOpen(true);
    }

    function closeOptions() {
        setIsOpen(false);
    }

    function handleSubmit(newValue: TagModel) {
        closeOptions();

        if (value.slug !== newValue.slug) {
            onChange(newValue);
        }
    }

    function handleCancel() {
        closeOptions();
    }

    function handleChange(newValue: TagModel) {
        handleSubmit(newValue);
    }

    useEffect(() => {
        setIsRendered(dropdownRef.current !== null);
    }, [dropdownRef.current]);

    const cls = classNames(classes.dropdownTags, className, {
        [classes.open]: isOpen,
    });

    return (
        <button
            ref={dropdownRef}
            className={cls}
            onClick={openOptions}>
            <div className={classes.text}>
                {value.name}
                <IconChevronDown color="var(--label-secondary-color)"/>
            </div>
            {isOpen && isRendered && (
                <Popover
                    anchor={dropdownRef.current!}
                    direction={PopoverDirection.Vertical}
                    offset={OPTIONS_OFFSET}
                    onClose={handleCancel}
                    onCancel={handleCancel}>
                    <Options
                        options={tagOptions}
                        workspaceSlug={workspaceSlug}
                        value={value}
                        linksDisabled={linksDisabled}
                        onChange={handleChange}/>
                </Popover>
            )}
        </button>
    );
}

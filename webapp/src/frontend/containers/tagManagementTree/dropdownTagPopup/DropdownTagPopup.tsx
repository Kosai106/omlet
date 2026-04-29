import { type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

import classNames from "classnames";

import { createTag, type Tag as TagModel } from "../../../../common/models/Tag";
import { generateSlug } from "../../../../common/utils";
import { Keyboard } from "../../../enums";
import { Checkbox } from "../../../library/Checkbox/Checkbox";
import { IconAdd } from "../../../library/icons/IconAdd";
import { PopoverDirection, Popover } from "../../../library/Popover/Popover";
import { Tag } from "../../../library/Tag/Tag";
import { generateGetTextWidth } from "../../../utils";

import classes from "./DropdownTagPopup.module.css";

const CHARACTER_COUNT_LIMIT = 20;

function searchValueToTag(name: string): TagModel {
    const tagName = name.trim();

    return createTag({
        name: tagName,
        slug: generateSlug(`${tagName}-${Date.now()}`),
    });
}

interface Props {
    anchor: HTMLElement;
    tags?: TagModel[];
    selectedTags?: TagModel[];
    onAdd(tag: TagModel): void;
    onRemove?(tag: TagModel): void;
    onClose(): void;
}
export function DropdownTagPopup({
    anchor,
    tags,
    selectedTags = [],
    onAdd,
    onRemove,
    onClose,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [truncatedSearchValue, setTruncatedSearchValue] = useState<string>("");
    const [searchValue, setSearchValue] = useState<string>("");
    const [focusedTag, setFocusedTag] = useState<TagModel | null>(null);

    const searchValueSlug = useMemo(() => generateSlug(searchValue), [searchValue]);
    const filteredTags = useMemo(() => tags?.filter(({ slug, name }) => !searchValue || slug.includes(searchValueSlug) || name.includes(searchValue)), [searchValue, tags]);
    const hasSameTag = useMemo(() => tags?.some(({ slug, name }) => slug === searchValueSlug || name === searchValue.trim()), [searchValue, tags]);

    const shouldShowAddButton = searchValueSlug ? !hasSameTag : !tags;
    const isAddButtonFocused = searchValueSlug && (!filteredTags?.length || focusedTag?.slug === searchValueSlug);

    useEffect(() => {
        const tagName = searchValue.trim();
        const getTextWidth = generateGetTextWidth();

        function getAddTagLabelWidth(text: string): number {
            return getTextWidth(`Add “${text}”`);
        }

        if (getAddTagLabelWidth(tagName) < 170) {
            return setTruncatedSearchValue(tagName);
        }

        let newTruncatedSearchValue = `…${tagName.substring(1)}`;
        while (getAddTagLabelWidth(newTruncatedSearchValue) >= 170) {
            newTruncatedSearchValue = `…${newTruncatedSearchValue.substring(2)}`;
        }
        setTruncatedSearchValue(newTruncatedSearchValue);
    }, [searchValue.trim()]);

    function handleCancel() {
        onClose();
        setSearchValue("");
    }

    function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
        setSearchValue(e.target.value.substring(0, CHARACTER_COUNT_LIMIT));
    }

    function handleAdd() {
        onAdd(searchValueToTag(searchValue));
        onClose();
        setSearchValue("");
    }

    function handleCheckboxChange(tag: TagModel) {
        if (selectedTags?.includes(tag)) {
            onRemove?.(tag);
        } else {
            onAdd(tag);
        }
    }

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (!filteredTags?.length) {
                return;
            }
            switch (event.code) {
                case Keyboard.Code.ArrowDown:
                    event.preventDefault();
                    inputRef.current?.blur();
                    if (focusedTag === null || focusedTag.slug === searchValueSlug) {
                        setFocusedTag(filteredTags[0]);
                    } else {
                        const index = filteredTags.findIndex(({ slug }) => slug === focusedTag.slug);
                        setFocusedTag(index === filteredTags.length - 1 && shouldShowAddButton ? searchValueToTag(searchValue) : filteredTags[(index + 1) % filteredTags.length]);
                    }
                    break;

                case Keyboard.Code.ArrowUp:
                    event.preventDefault();
                    inputRef.current?.blur();
                    if (focusedTag === null) {
                        setFocusedTag(searchValueToTag(searchValue));
                    } else if (focusedTag.slug === searchValueSlug) {
                        setFocusedTag(filteredTags[filteredTags.length - 1]);
                    } else {
                        const index = filteredTags.findIndex(({ slug }) => slug === focusedTag.slug);
                        setFocusedTag(index === 0 && shouldShowAddButton ? searchValueToTag(searchValue) : filteredTags[(index - 1 + filteredTags.length) % filteredTags.length]);
                    }
                    break;

                case Keyboard.Code.Enter:
                    if (searchValueSlug && focusedTag?.slug === searchValueSlug) {
                        event.preventDefault();
                        handleAdd();
                    } else if (focusedTag) {
                        event.preventDefault();
                        handleCheckboxChange(focusedTag);
                    }
                    break;

                case Keyboard.Code.Escape:
                    event.preventDefault();
                    if (searchValue) {
                        setSearchValue("");
                    } else {
                        handleCancel();
                    }
                    break;

                default:
                    inputRef.current?.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [focusedTag, filteredTags]);

    function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        switch (event.code) {
            case Keyboard.Code.Escape:
                event.stopPropagation();
                if (searchValue) {
                    setSearchValue("");
                } else {
                    handleCancel();
                }
                break;

            case Keyboard.Code.Enter:
                event.preventDefault();
                if (searchValueSlug) {
                    handleAdd();
                }
                break;
        }
    }

    return (
        <Popover
            anchor={anchor}
            direction={PopoverDirection.Vertical}
            offset={4}
            onClose={handleCancel}
            onCancel={handleCancel}>
            <div className={classes.dropdownTagPopup}>
                <input
                    ref={inputRef}
                    className={classes.input}
                    type="search"
                    placeholder="Add tag"
                    value={searchValue}
                    maxLength={CHARACTER_COUNT_LIMIT}
                    spellCheck={false}
                    autoFocus
                    onFocus={() => setFocusedTag(null)}
                    onKeyDown={handleInputKeyDown}
                    onChange={handleInputChange}/>
                {
                    filteredTags?.map((tag) => (
                        <label key={tag.slug} className={classNames(classes.row, { [classes.focused]: focusedTag?.slug === tag.slug })} onMouseMove={() => setFocusedTag(tag)}>
                            <Checkbox
                                className={classes.optionCheckbox}
                                checked={selectedTags.some(selected => selected.slug === tag.slug)}
                                value={tag}
                                onChange={handleCheckboxChange}
                            />
                            <Tag tag={tag} className={classes.tag} large />
                        </label>
                    ))
                }
                {shouldShowAddButton && (
                    <div className={classes.row}>
                        <button
                            type="button"
                            className={classNames(classes.add, { [classes.focused]: isAddButtonFocused })}
                            disabled={!searchValueSlug}
                            onClick={handleAdd}
                            onMouseMove={() => setFocusedTag(searchValueToTag(searchValue))}>
                            <div className={classes.iconBox}>
                                <IconAdd/>
                            </div>
                            {searchValue ? `Add “${truncatedSearchValue}”` : "Add new tag"}
                        </button>
                    </div>
                )}
            </div>
        </Popover>
    );
}

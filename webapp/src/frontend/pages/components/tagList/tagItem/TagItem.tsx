import { type FormEvent, useRef, useState } from "react";

import classNames from "classnames";

import { type Tag, RESERVED_TAGS } from "../../../../../common/models/Tag";
import { ContextMenu, MenuAlignment, MenuItemKind } from "../../../../library/ContextMenu/ContextMenu";
import { IconMenu } from "../../../../library/icons/IconMenu";
import { type TextInputHandle, TextInput } from "../../../../library/TextInput/TextInput";

import classes from "./TagItem.module.css";

interface Props {
    tag: Tag;
    tags: Tag[];
    selected?: boolean;
    hasOverrides?: boolean;
    readOnly?: boolean;
    onSelect(tagSlug?: string): void;
    onRename(tagSlug: string, name: string): void;
    onDelete(tag: Tag): void;
}

export function TagItem({
    tag,
    tags,
    selected = false,
    hasOverrides = false,
    readOnly = false,
    onSelect,
    onRename,
    onDelete,
}: Props) {
    const formRef = useRef<HTMLFormElement>(null);
    const nameInputRef = useRef<TextInputHandle>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState(tag.name);
    const [error, setError] = useState("");

    function handleRename() {
        setIsRenaming(true);
    }

    function handleChange(newName: string) {
        setName(newName);
        setError("");
    }

    function handleFormSubmit(event: FormEvent) {
        event.preventDefault();

        const trimmedName = name.trim();
        let error = "";
        if (!trimmedName) {
            error = "Tag name cannot be empty.";
        } else if (tags.some(t => t.slug !== tag.slug && t.name === trimmedName)) {
            error = `“${trimmedName}” already exists.`;
        }

        if (error) {
            setError(error);
            nameInputRef.current?.select();
        } else {
            onRename(tag.slug, trimmedName);
            setIsRenaming(false);
        }
    }

    function handleBlur() {
        formRef.current?.requestSubmit();
    }

    function handleCancel() {
        setName(tag.name);
        setError("");
        setIsRenaming(false);
    }

    function renderContent() {
        const indicator = <div className={classes.tagIndicator} style={{ backgroundColor: tag.color }}/>;

        if (isRenaming) {
            return (
                <form
                    ref={formRef}
                    className={classes.form}
                    onSubmit={handleFormSubmit}>
                    {indicator}
                    <TextInput
                        ref={nameInputRef}
                        className={classes.tagNameInput}
                        value={name}
                        placeholder="Type a name"
                        maxLength={20}
                        autoSelect
                        onBlur={handleBlur}
                        onChange={handleChange}
                        onCancel={handleCancel}/>
                    {error && <div className={classes.error}>☝️ {error}</div>}
                </form>
            );
        }

        return (
            <>
                <button
                    type="button"
                    className={classes.tagButton}
                    onClick={() => onSelect(tag.slug)}>
                    {indicator}
                    <span className={classes.tagName}>{name}</span>
                </button>
                {hasOverrides && <div className={classes.updateIndicator}/>}
                {!readOnly && (
                    <button
                        ref={menuButtonRef}
                        type="button"
                        className={classes.menuButton}
                        onClick={() => setContextMenuOpen(true)}>
                        <IconMenu/>
                    </button>
                )}
            </>
        );
    }

    const className = classNames(classes.tagItem, {
        [classes.selected]: selected,
        [classes.renaming]: isRenaming,
        [classes.menuOpen]: contextMenuOpen,
        [classes.hasError]: error,
    });

    return (
        <div className={className}>
            {renderContent()}
            {contextMenuOpen && (
                <ContextMenu
                    anchorRect={menuButtonRef.current!.getBoundingClientRect()}
                    alignment={MenuAlignment.Left}
                    onClose={() => setContextMenuOpen(false)}>
                    <ContextMenu.Button
                        onClick={handleRename}>
                        Rename tag
                    </ContextMenu.Button>
                    {tag.slug !== RESERVED_TAGS.CORE.slug && (
                        <ContextMenu.Button
                            kind={MenuItemKind.Critical}
                            onClick={() => onDelete(tag)}>
                            Delete tag
                        </ContextMenu.Button>
                    )}
                </ContextMenu>
            )}
        </div>
    );
}

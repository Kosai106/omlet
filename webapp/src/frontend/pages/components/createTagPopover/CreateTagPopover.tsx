import { type ChangeEvent, type FormEvent, useState } from "react";

import { type Tag } from "../../../../common/models/Tag";
import { Button } from "../../../library/Button/Button";
import { Popover, PopoverDirection } from "../../../library/Popover/Popover";

import classes from "./CreateTagPopover.module.css";

const TAG_NAME_LIMIT = 20;

interface Props {
    anchor: HTMLElement;
    tags: Tag[];
    isCreating?: boolean;
    onSubmit(name: string): void;
    onCancel(): void;
}

export function CreateTagPopover({
    anchor,
    tags,
    isCreating = false,
    onSubmit,
    onCancel,
}: Props) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const newName = event.target.value;
        setName(newName);

        const trimmedName = newName.trim();
        if (tags.some(tag => tag.name === trimmedName)) {
            setError(`☝️ “${trimmedName}” already exists.`);
        } else {
            setError("");
        }
    }

    function handleSave(event: FormEvent) {
        event.preventDefault();

        onSubmit(name.trim());
    }

    return (
        <Popover
            className={classes.createTagPopover}
            anchor={anchor}
            direction={PopoverDirection.BottomLeft}
            onClose={onCancel}
            onCancel={onCancel}>
            <form
                className={classes.createTagForm}
                onSubmit={handleSave}>
                <input
                    className={classes.tagNameInput}
                    type="text"
                    placeholder="Name your tag"
                    value={name}
                    maxLength={TAG_NAME_LIMIT}
                    spellCheck={false}
                    disabled={isCreating}
                    autoFocus
                    required
                    onChange={handleChange}/>
                <footer>
                    <Button
                        className={classes.saveButton}
                        type="submit"
                        disabled={isCreating || name === "" || error !== ""}>
                        {isCreating ? "Creating…" : "Create new tag"}
                    </Button>
                    {error && <div className={classes.error}>{error}</div>}
                </footer>
            </form>
        </Popover>
    );
}

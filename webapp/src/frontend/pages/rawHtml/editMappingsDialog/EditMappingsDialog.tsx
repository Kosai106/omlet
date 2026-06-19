import { useState } from "react";

import { updateHtmlElementMap } from "../../../api/api";
import { Button, ButtonKind } from "../../../library/Button/Button";
import { Dialog } from "../../../library/Dialog/Dialog";
import { H2 } from "../../../library/Heading/Heading";
import { NinjaInput } from "../../../library/NinjaInput/NinjaInput";
import { useToast } from "../../../library/Toast/Toast";
import { logError } from "../../../logger";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import classes from "./EditMappingsDialog.module.css";

interface Props {
    elements: string[];
    onClose(): void;
    onSaved(): void;
}

export function EditMappingsDialog({ elements, onClose, onSaved }: Props) {
    const toast = useToast();
    const {
        actions: { setWorkspace },
        selectors: { getWorkspace },
    } = useStore();

    const workspace = getWorkspace()!;

    // Start from the effective map (defaults overlaid by stored overrides) so
    // unedited mappings, including those for elements not currently rendered,
    // are preserved on save.
    const [mappings, setMappings] = useState<Record<string, string>>({ ...workspace.htmlElementMap });
    const [isSaving, setIsSaving] = useState(false);

    function handleChange(element: string, replacement: string) {
        setMappings(current => ({ ...current, [element]: replacement }));
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            const { workspace: updatedWorkspace, accessLevel } = await updateHtmlElementMap(workspace.slug, mappings);
            setWorkspace(updatedWorkspace, accessLevel);
            toast.show("Replacement mappings saved");
            onSaved();
            onClose();
        } catch (error) {
            logError(error);
            toast.show("Could not save mappings");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog className={classes.dialog} onClose={onClose}>
            <div className={classes.content}>
                <div>
                    <H2 className={classes.header}>Edit replacement mappings</H2>
                    <p className={classes.description}>
                        Map each raw HTML element to the design-system component that should replace it.
                        Leave a field blank to show no suggestion for that element.
                    </p>
                </div>
                <div className={classes.rows}>
                    {elements.map(element => (
                        <div key={element} className={classes.row}>
                            <code className={classes.element}>{`<${element}>`}</code>
                            <NinjaInput
                                className={classes.input}
                                placeholder="No replacement"
                                value={mappings[element] ?? ""}
                                onInput={value => handleChange(element, value)}
                                maxLength={50}/>
                        </div>
                    ))}
                </div>
                <div className={classes.actions}>
                    <Button kind={ButtonKind.Secondary} onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>Save</Button>
                </div>
            </div>
        </Dialog>
    );
}

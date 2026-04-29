import { useState, useRef } from "react";

import { type Project } from "../../../../../common/models/Project";
import { NinjaInput, type NinjaInputHandle } from "../../../../library/NinjaInput/NinjaInput";
import { useToast } from "../../../../library/Toast/Toast";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";

import classes from "./ProjectDialogCell.module.css";

interface ProjectDialogCellProps {
    project: Project;
    aliases: string[];
    onChange(name: string, alias: string) : void;
}

export function ProjectDialogCell({ project, aliases, onChange }: ProjectDialogCellProps) {
    const inputRef = useRef<NinjaInputHandle>(null);
    const repositoryRef = useRef<HTMLSpanElement>(null);
    const toast = useToast();
    const [error, setError] = useState("");

    function handleChange(alias: string) {
        if (aliases.includes(alias)) {
            inputRef.current?.select();
            setError(`☝️ “${alias}” already exists.`);
        } else if (alias === "") {
            onChange(project.name, project.name);
            setError("");
        } else {
            onChange(project.name, alias);
            setError("");
        }
    }

    function handleRepositoryClick() {
        window.navigator.clipboard.writeText(project.repository?.url ?? "");
        const range = document.createRange();
        range.selectNodeContents(repositoryRef.current!);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        toast.show("Link copied to clipboard!");
    }

    function renderExtraInfo() {
        if (error) {
            return error;
        }

        if (project.alias) {
            return <>Renamed from “<Tooltip delay={150} content={project.name}>{project.name}</Tooltip>”</>;
        }

        return null;
    }

    return (
        <div className={classes.project}>
            <div className={classes.inputRenamedText}>
                <NinjaInput className={classes.input}
                    ref={inputRef}
                    placeholder={project.name}
                    value={project.alias ?? project.name}
                    onChange={handleChange}
                    maxLength={50}
                />
                <div className={classes.renamedText}>{renderExtraInfo()}</div>
            </div>
            <span ref={repositoryRef} className={classes.repository} onClick={handleRepositoryClick}>{project.repository?.url}</span>
        </div>
    );
}

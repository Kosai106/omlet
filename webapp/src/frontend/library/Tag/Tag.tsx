import { type MouseEvent } from "react";

import classNames from "classnames";

import { type Tag as TagModel } from "../../../common/models/Tag";
import { IconRemove } from "../icons/IconRemove";

import classes from "./Tag.module.css";

interface Props {
    tag: TagModel;
    selected?: boolean;
    large?: boolean;
    active?: boolean;

    className?: string;
    onClick?(e: MouseEvent<HTMLButtonElement>, tag: TagModel): void;
    onDelete?(tag: TagModel): void;
}

export function Tag({ tag, selected = false, large = false, active, className, onClick, onDelete }: Props) {
    const { name, color } = tag;
    const cls = classNames(
        classes.tag,
        {
            [classes.selected]: selected,
            [classes.large]: large,
        },
        className
    );

    if (onClick) {
        const buttonClassName = classNames(
            classes.button,
            {
                [classes.active]: active,
                [classes.activeNotDefined]: active === undefined,
            },
            cls,
        );
        return (
            <button className={buttonClassName} onClick={(e) => onClick(e, tag)}>
                <div className={classes.tagIndicator} style={{ backgroundColor: color }}/>
                <div>{name}</div>
                {onDelete && <button className={classes.deleteButton} onClick={() => onDelete(tag)}><IconRemove /></button>}
            </button>
        );
    }

    return (
        <div className={cls}>
            <div className={classes.tagIndicator} style={{ backgroundColor: color }}/>
            <div className={classes.tagName}>{name}</div>
            {onDelete && <button className={classes.deleteButton} onClick={() => onDelete(tag)}><IconRemove /></button>}
        </div>
    );
}

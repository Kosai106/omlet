import { type CSSProperties, useRef, useEffect } from "react";

import classNames from "classnames";

import { IconCheck } from "../icons/IconCheck";
import { IconRemove } from "../icons/IconRemove";

import classes from "./Checkbox.module.css";

interface Props<T> {
    className?: string;
    value: T;
    checked?: boolean;
    readOnly?: boolean;
    indeterminate?: boolean;
    onChange?(value: T, checked: boolean): void;
}

export function Checkbox<T>({
    className,
    value,
    checked = false,
    readOnly = false,
    indeterminate = false,
    onChange,
}: Props<T>) {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleChange() {
        onChange?.(value, inputRef.current!.checked);
    }

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [inputRef.current, indeterminate]);

    return (
        <div className={classNames(classes.checkbox, className)}>
            <input
                ref={inputRef}
                type="checkbox"
                value={String(value)}
                checked={checked}
                readOnly={readOnly}
                onChange={handleChange}/>
            <div className={classes.indicator}>
                {checked && <IconCheck/>}
                {indeterminate && <IconRemove/>}
            </div>
        </div>
    );
}

interface SolidProps<T> extends Props<T> {
    color?: string;
}

function SolidCheckbox<T>({
    className,
    color,
    value,
    checked = false,
    readOnly = false,
    onChange,
}: SolidProps<T>) {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleChange() {
        onChange?.(value, inputRef.current!.checked);
    }

    return (
        <div
            className={classNames(classes.checkbox, classes.solid, className)}
            style={{ "--checkbox-color": color } as CSSProperties}>
            <input
                ref={inputRef}
                type="checkbox"
                value={String(value)}
                checked={checked}
                readOnly={readOnly}
                onChange={handleChange}/>
            <div className={classes.indicator}>
                {checked && <IconCheck/>}
            </div>
        </div>
    );
}

Checkbox.Solid = SolidCheckbox;

import { useRef } from "react";

import classNames from "classnames";

import classes from "./Radio.module.css";

interface Props<T> {
    className?: string;
    name: string;
    value: T;
    checked?: boolean;
    readOnly?: boolean;
    onChange?(value: T): void;
}

export function Radio<T>({
    className,
    name,
    value,
    checked = false,
    readOnly = false,
    onChange,
}: Props<T>) {
    const inputRef = useRef<HTMLInputElement>(null);

    function handleChange() {
        onChange?.(value);
    }

    return (
        <div className={classNames(classes.radio, className)}>
            <input
                ref={inputRef}
                type="radio"
                name={name}
                value={String(value)}
                checked={checked}
                readOnly={readOnly}
                onChange={handleChange}/>
            <div className={classes.indicator}>
                <div className={classes.indicatorCheckedCircle}/>
            </div>
        </div>
    );
}

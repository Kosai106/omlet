import { type PropsWithChildren, useMemo, createContext, useContext } from "react";

import classNames from "classnames";

import classes from "./SegmentedControl.module.css";

type Value = string | number | boolean;

interface Context {
    name: string;
    value?: Value;
    disabled?: boolean;
    onChange: (value: Value) => void;
}

const ControlValueContext = createContext<Context>({ name: "", onChange: () => {} });

enum Type {
    Default = "default",
    Compact = "compact",
}

interface SegmentedControlProps<T extends Value> {
    type?: Type;
    value?: T;
    className?: string;
    disabled?: boolean;
    onChange: (value: T) => void;
}

export function SegmentedControl<T extends Value>({
    type = Type.Default,
    value,
    className,
    disabled = false,
    children,
    onChange,
}: PropsWithChildren<SegmentedControlProps<T>>) {
    const name = useMemo(() => window.crypto.randomUUID(), []);

    return (
        <ControlValueContext.Provider value={{
            name,
            value,
            disabled,
            onChange: onChange as (value: Value) => void,
        }}>
            <div className={classNames(classes.segmentedControl, className, { [classes.compact]: type === Type.Compact })}>
                {children}
            </div>
        </ControlValueContext.Provider>
    );
}

interface OptionProps<T extends Value> {
    value: T;
    className?: string;
}

function Option<T extends Value>({
    value,
    className,
    children,
}: PropsWithChildren<OptionProps<T>>) {
    const {
        name,
        value: controlValue,
        disabled,
        onChange,
    } = useContext(ControlValueContext);

    return (
        <label className={classNames(classes.segmentedControlButton, className)}>
            <input
                type="radio"
                name={name}
                value={String(value)}
                checked={value === controlValue}
                disabled={disabled}
                onChange={() => onChange(value)}/>
            {children}
        </label>
    );
}

SegmentedControl.Option = Option;

export { Type as SegmentedControlType };

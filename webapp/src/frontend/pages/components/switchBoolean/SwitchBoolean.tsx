import { type ReactNode } from "react";

import { IconRemove } from "../../../library/icons/IconRemove";
import { SegmentedControl, SegmentedControlType } from "../../../library/SegmentedControl/SegmentedControl";

import classes from "./SwitchBoolean.module.css";

interface Props {
    icon?: ReactNode;
    label: string;
    value?: boolean;
    onChange(value: boolean | undefined): void;
}

export function SwitchBoolean({
    icon,
    label,
    value = true,
    onChange,
}: Props) {

    function handleRemove() {
        onChange(undefined);
    }

    return (
        <div className={classes.switchBooleanContainer}>
            <div className={classes.switchBoolean}>
                <span className={classes.mainLabel}>{icon}{label}</span>
                <SegmentedControl type={SegmentedControlType.Compact} value={value} onChange={onChange}>
                    <SegmentedControl.Option value={true}>
                        Yes
                    </SegmentedControl.Option>
                    <SegmentedControl.Option value={false}>
                        No
                    </SegmentedControl.Option>
                </SegmentedControl>
            </div>
            <button className={classes.removeButton} onClick={handleRemove}>
                <IconRemove/>
            </button>
        </div>
    );
}

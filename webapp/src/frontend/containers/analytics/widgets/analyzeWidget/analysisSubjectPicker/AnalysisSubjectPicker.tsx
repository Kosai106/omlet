import { useRef, useState } from "react";

import { AnalysisSubject } from "../../../../../../common/models/AnalysisSubject";
import { SegmentedControl } from "../../../../../library/SegmentedControl/SegmentedControl";
import { Tooltip } from "../../../../../library/Tooltip/Tooltip";

import { AnalysisSubjectButton } from "./AnalysisSubjectButton/AnalysisSubjectButton";
import { CustomPropertiesDropdown } from "./CustomPropertiesDropdown/CustomPropertiesDropdown";

import classes from "./AnalysisSubjectPicker.module.css";

const TOOLTIP_DELAY = 300;

interface Props {
    subject?: AnalysisSubject;
    customProperty?: string;
    customProperties?: Record<string, (string | number | boolean | Date)[]>;
    disabled?: boolean;
    onChange(subject: AnalysisSubject, customProperty?: string): void;
}

export function AnalysisSubjectPicker({
    subject,
    customProperty,
    customProperties,
    disabled = false,
    onChange,
}: Props) {
    const [tooltipDelay, setTooltipDelay] = useState<number>(TOOLTIP_DELAY);
    const tooltipDelaySetRef = useRef<ReturnType<typeof setTimeout>>();

    function handleMouseEnter() {
        if (tooltipDelaySetRef.current) {
            clearTimeout(tooltipDelaySetRef.current);
        }
        tooltipDelaySetRef.current = setTimeout(() => {
            setTooltipDelay(0);
        }, TOOLTIP_DELAY);
    }

    function handleMouseLeave() {
        if (tooltipDelaySetRef.current) {
            clearTimeout(tooltipDelaySetRef.current);
        }
        setTooltipDelay(TOOLTIP_DELAY);
    }

    return (
        <Tooltip content={disabled ? "Ask to join workspace to edit" : undefined} followCursor>
            <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <SegmentedControl className={classes.analysisSubjectPicker} value={subject} disabled={disabled} onChange={onChange}>
                    <AnalysisSubjectButton tooltipDelay={tooltipDelay} disabled={disabled} value={AnalysisSubject.Components}/>
                    <AnalysisSubjectButton tooltipDelay={tooltipDelay} disabled={disabled} value={AnalysisSubject.Projects}/>
                    <AnalysisSubjectButton tooltipDelay={tooltipDelay} disabled={disabled} value={AnalysisSubject.Tags}/>
                    <CustomPropertiesDropdown
                        customProperties={customProperties}
                        value={customProperty}
                        tooltipDelay={tooltipDelay}
                        selected={subject === AnalysisSubject.CustomProperties}
                        disabled={disabled}
                        onChange={customProperty => onChange(AnalysisSubject.CustomProperties, customProperty)}/>
                </SegmentedControl>
            </div>
        </Tooltip>
    );
}


import { AnalysisType, getAnalysisTypeLabel } from "../../../../../common/models/AnalysisType";
import { H3 } from "../../../../library/Heading/Heading";
import { SegmentedControl } from "../../../../library/SegmentedControl/SegmentedControl";
import { Tooltip } from "../../../../library/Tooltip/Tooltip";

import classes from "./UsageWidget.module.css";

interface Props {
    analysisType: AnalysisType;
    disabled?: boolean;
    onTypeChange(type: AnalysisType): void;
}

interface ButtonProps {
    value: AnalysisType;
}

function AnalysisTypeButton({ value }: ButtonProps) {
    return (
        <SegmentedControl.Option value={value}>
            {getAnalysisTypeLabel(value)}
        </SegmentedControl.Option>
    );
}

export function UsageWidget({
    analysisType,
    disabled = false,
    onTypeChange,
}: Props) {
    return (
        <div className={classes.usageWidget}>
            <H3 className={classes.title}>Usage</H3>
            <Tooltip content={disabled ? "Ask to join workspace to edit" : undefined} followCursor>
                <SegmentedControl value={analysisType} disabled={disabled} onChange={onTypeChange}>
                    <AnalysisTypeButton value={AnalysisType.LatestData}/>
                    <AnalysisTypeButton value={AnalysisType.DataOverTime}/>
                </SegmentedControl>
            </Tooltip>
        </div>
    );
}

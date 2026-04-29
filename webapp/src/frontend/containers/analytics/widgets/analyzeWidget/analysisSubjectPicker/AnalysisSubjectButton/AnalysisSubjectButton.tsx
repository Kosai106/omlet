import { type AnalysisSubject, getAnalysisSubjectLabel } from "../../../../../../../common/models/AnalysisSubject";
import { SegmentedControl } from "../../../../../../library/SegmentedControl/SegmentedControl";
import { AnalysisSubjectIcon } from "../AnalysisSubjectIcon/AnalysisSubjectIcon";
import { AnalysisSubjectTooltip } from "../AnalysisSubjectTooltip/AnalysisSubjectTooltip";

import classes from "./AnalysisSubjectButton.module.css";

interface Props {
    value: AnalysisSubject;
    disabled: boolean;
    tooltipDelay: number;
}

export function AnalysisSubjectButton({ disabled, value, tooltipDelay }: Props) {
    return (
        <AnalysisSubjectTooltip
            analysisSubject={value}
            delay={tooltipDelay}
            disabled={disabled}>
            <SegmentedControl.Option className={classes.analysisSubjectButton} value={value}>
                <AnalysisSubjectIcon subject={value}/>
                {getAnalysisSubjectLabel(value)}
            </SegmentedControl.Option>
        </AnalysisSubjectTooltip>
    );
}

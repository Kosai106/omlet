import { type PropsWithChildren } from "react";

import { type AnalysisSubject, getAnalysisSubjectTooltipText } from "../../../../../../../common/models/AnalysisSubject";
import { Tooltip, TooltipPlacement } from "../../../../../../library/Tooltip/Tooltip";
import { AnalysisSubjectTooltipImage } from "../AnalysisSubjectTooltipImage/AnalysisSubjectTooltipImage";

import classes from "./AnalysisSubjectTooltip.module.css";

interface Props {
    analysisSubject: AnalysisSubject;
    delay: number;
    disabled: boolean;
}

export function AnalysisSubjectTooltip({
    analysisSubject,
    delay,
    disabled,
    children,
}: PropsWithChildren<Props>) {
    const tooltipContent = (
        <div className={classes.analysisSubjectTooltipContent}>
            {getAnalysisSubjectTooltipText(analysisSubject)}
            <AnalysisSubjectTooltipImage subject={analysisSubject}/>
        </div>
    );

    return (
        <Tooltip
            className={classes.analysisSubjectTooltip}
            placement={TooltipPlacement.RightTop}
            offset={8}
            delay={delay}
            content={disabled ? undefined : tooltipContent}>
            {children}
        </Tooltip>
    );
}

import { type AnalysisSubject } from "../../../../../common/models/AnalysisSubject";
import { H3 } from "../../../../library/Heading/Heading";

import { AnalysisSubjectPicker } from "./analysisSubjectPicker/AnalysisSubjectPicker";

import classes from "./AnalyzeWidget.module.css";

interface Props {
    analysisSubject?: AnalysisSubject;
    customProperty?: string;
    customProperties?: Record<string, (string | number | boolean | Date)[]>;
    disabled?: boolean;
    onSubjectChange(subject: AnalysisSubject, customProperty?: string): void;
}

export function AnalyzeWidget({
    analysisSubject,
    customProperty,
    customProperties,
    disabled = false,
    onSubjectChange,
}: Props) {
    return (
        <div className={classes.analyzeWidget}>
            <H3 className={classes.title}>Analyze</H3>
            <AnalysisSubjectPicker
                subject={analysisSubject}
                customProperty={customProperty}
                customProperties={customProperties}
                disabled={disabled}
                onChange={onSubjectChange}/>
        </div>
    );
}

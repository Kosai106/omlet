import { AnalysisSubject } from "../../../../../../../common/models/AnalysisSubject";
import { IconComponents } from "../../../../../../library/icons/IconComponents";
import { IconFolder } from "../../../../../../library/icons/IconFolder";
import { IconMetadata } from "../../../../../../library/icons/IconMetadata";
import { IconTag } from "../../../../../../library/icons/IconTag";

import classes from "./AnalysisSubjectIcon.module.css";

interface Props {
    subject: AnalysisSubject;
}

export function AnalysisSubjectIcon({ subject }: Props) {
    switch (subject) {
        case AnalysisSubject.Components:
            return <IconComponents/>;
        case AnalysisSubject.Projects:
            return <IconFolder className={classes.analysisSubjectIcon}/>;
        case AnalysisSubject.Tags:
            return <IconTag/>;
        case AnalysisSubject.CustomProperties:
            return <IconMetadata/>;
    }
}

import { AnalysisSubject } from "../../../../../../../common/models/AnalysisSubject";
import { ImgComponentsTooltip } from "../../../../../../library/icons/ImgComponentsTooltip";
import { ImgCustomPropertiesTooltip } from "../../../../../../library/icons/ImgCustomPropertiesTooltip";
import { ImgProjectsTooltip } from "../../../../../../library/icons/ImgProjectsTooltip";
import { ImgTagsTooltip } from "../../../../../../library/icons/ImgTagsTooltip";

interface Props {
    subject: AnalysisSubject;
}

export function AnalysisSubjectTooltipImage({ subject }: Props) {
    switch (subject) {
        case AnalysisSubject.Components:
            return <ImgComponentsTooltip/>;
        case AnalysisSubject.Projects:
            return <ImgProjectsTooltip/>;
        case AnalysisSubject.Tags:
            return <ImgTagsTooltip/>;
        case AnalysisSubject.CustomProperties:
            return <ImgCustomPropertiesTooltip/>;
    }
}

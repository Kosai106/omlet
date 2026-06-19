import { type AnalysisSubject } from "../../../../common/models/AnalysisSubject";
import { AnalysisType } from "../../../../common/models/AnalysisType";
import { type BreakdownType } from "../../../../common/models/BreakdownType";
import { type Filter } from "../../../../common/models/Filter";
import { ButtonKind, ButtonLink } from "../../../library/Button/Button";
import { IconBack } from "../../../library/icons/IconBack";
import { AnalyzeWidget } from "../widgets/analyzeWidget/AnalyzeWidget";
import { BreakdownWidget } from "../widgets/breakdownWidget/BreakdownWidget";
import { FilterWidget } from "../widgets/filterWidget/FilterWidget";
import { UsageWidget } from "../widgets/usageWidget/UsageWidget";

import classes from "./Filters.module.css";

interface Props {
    backURL: string;
    analysisType: AnalysisType;
    analysisSubject?: AnalysisSubject;
    customProperty?: string;
    filters: Partial<Filter>[];
    breakdownType?: BreakdownType;
    customProperties?: Record<string, (string | number | boolean | Date)[]>;
    disabled?: boolean;
    onAnalysisTypeChange(analysisType: AnalysisType): void;
    onAnalysisSubjectChange(analysisSubject: AnalysisSubject, customProperty?: string): void;
    onFiltersChange(filters: Filter[]): void;
    onBreakdownTypeChange(breakdownType: BreakdownType | undefined, customProperty?: string): void;
}

export function Filters({
    backURL,
    analysisType,
    analysisSubject,
    customProperty,
    filters,
    breakdownType,
    customProperties,
    disabled = false,
    onAnalysisTypeChange,
    onAnalysisSubjectChange,
    onFiltersChange,
    onBreakdownTypeChange,
}: Props) {
    return (
        <div className={classes.filters}>
            <nav>
                {!disabled && (
                    <ButtonLink kind={ButtonKind.Secondary} to={backURL} icon={<IconBack/>}>
                        Back to Dashboard
                    </ButtonLink>
                )}
            </nav>
            <div className={classes.widgets}>
                <AnalyzeWidget
                    analysisSubject={analysisSubject}
                    customProperty={customProperty}
                    customProperties={customProperties}
                    disabled={disabled}
                    onSubjectChange={onAnalysisSubjectChange}/>
                <UsageWidget
                    analysisType={analysisType}
                    onTypeChange={onAnalysisTypeChange}
                    disabled={disabled}/>
                <FilterWidget
                    filters={filters}
                    disabled={disabled}
                    onFiltersChange={onFiltersChange}/>
                {analysisType === AnalysisType.LatestData && (
                    <BreakdownWidget
                        analysisSubject={analysisSubject}
                        breakdownType={breakdownType}
                        customProperty={customProperty}
                        customProperties={customProperties}
                        onBreakdownChange={onBreakdownTypeChange}
                        disabled={disabled}/>
                )}
            </div>
        </div>
    );
}

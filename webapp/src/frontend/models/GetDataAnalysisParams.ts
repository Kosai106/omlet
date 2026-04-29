import { type AnalysisSubject } from "../../common/models/AnalysisSubject";
import { type AnalysisType } from "../../common/models/AnalysisType";
import { type BreakdownType } from "../../common/models/BreakdownType";
import { type Filter } from "../../common/models/Filter";
import { type TimeSeriesFilter } from "../../common/models/TimeSeriesFilter";
import { type Workspace } from "../models/Workspace";

export interface GetDataAnalysisParams {
    workspace: Workspace;
    analysisType: AnalysisType;
    analysisSubject: AnalysisSubject;
    customProperty?: string;
    filters?: Partial<Filter>[];
    timeSeriesFilter?: TimeSeriesFilter;
    breakdownType?: BreakdownType;
}

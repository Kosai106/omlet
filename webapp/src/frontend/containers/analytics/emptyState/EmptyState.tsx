import classNames from "classnames";

import { AnalysisSubject } from "../../../../common/models/AnalysisSubject";
import { getCompleteFilters, type Filter } from "../../../../common/models/Filter";

import classes from "./EmptyState.module.css";

interface Props {
    analysisSubject?: AnalysisSubject;
    filters: Filter[];
    onRemoveAllFilters(): void;
}

export function EmptyState({
    analysisSubject,
    filters,
    onRemoveAllFilters,
}: Props) {
    const content = analysisSubject === undefined
        ? "Select from the options on the left to start analyzing usage data."
        : "No results for the selected period.";

    const activeFilters = getCompleteFilters(filters);

    return (
        <div className={classNames(classes.emptyState, { [classes.lineChart]: analysisSubject !== AnalysisSubject.Tags })}>
            <div className={classes.kaomoji}>{analysisSubject === undefined ? "ᕕ( ᐛ )ᕗ" : "¯\\_(ツ)_/¯"}</div>
            <div className={classes.content}>{content}</div>
            {analysisSubject !== undefined && activeFilters.length > 0 && (
                <button
                    className={classes.removeFiltersButton}
                    type="button"
                    onClick={onRemoveAllFilters}>
                    Remove filters
                </button>
            )}
        </div>
    );
}

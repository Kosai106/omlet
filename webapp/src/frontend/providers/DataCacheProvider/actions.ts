import { type Dispatch } from "react";

import { type SavedChart } from "../../models/SavedChart";

import { type All } from "./payloads";
import { Types } from "./types";

export function getActions(dispatch: Dispatch<All>) {
    return {
        setSavedChartsData(savedCharts: SavedChart[]) {
            dispatch({
                type: Types.SET_SAVED_CHARTS_DATA,
                savedCharts,
            });
        },
        addSavedChartData(savedChart: SavedChart) {
            dispatch({
                type: Types.ADD_SAVED_CHART_DATA,
                savedChart,
            });
        },
        updateSavedChartData(slug: string, update: Partial<SavedChart>) {
            dispatch({
                type: Types.UPDATE_SAVED_CHART_DATA,
                slug,
                update,
            });
        },
        removeSavedChartData(slug: string) {
            dispatch({
                type: Types.REMOVE_SAVED_CHART_DATA,
                slug,
            });
        },
    };
}

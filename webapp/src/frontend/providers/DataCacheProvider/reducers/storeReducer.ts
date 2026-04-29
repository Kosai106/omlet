import { type DataCacheState } from "../DataCacheState";
import {
    type All,
    type SetSavedChartsData,
    type AddSavedChartData,
    type UpdateSavedChartData,
    type RemoveSavedChartData,
} from "../payloads";
import { Types } from "../types";

const reducers = {
    setSavedChartsData(state: DataCacheState, { savedCharts }: SetSavedChartsData): DataCacheState {
        return {
            ...state,
            savedCharts,
        };
    },
    addSavedChartData(state: DataCacheState, { savedChart }: AddSavedChartData): DataCacheState {
        if (!state.savedCharts) {
            return state;
        }

        return {
            ...state,
            savedCharts: [...state.savedCharts, savedChart],
        };
    },
    updateSavedChartData(state: DataCacheState, { slug, update }: UpdateSavedChartData): DataCacheState {
        if (!state.savedCharts) {
            return state;
        }

        return {
            ...state,
            savedCharts: state.savedCharts.map(chart => {
                if (chart.slug !== slug) {
                    return chart;
                }

                return {
                    ...chart,
                    ...update,
                };
            }),
        };
    },
    removeSavedChartData(state: DataCacheState, { slug }: RemoveSavedChartData): DataCacheState {
        if (!state.savedCharts) {
            return state;
        }

        return {
            ...state,
            savedCharts: state.savedCharts.filter(chart => chart.slug !== slug),
        };
    },
};

export function reducer(state: DataCacheState, action: All) {
    switch (action.type) {
        case Types.SET_SAVED_CHARTS_DATA:
            return reducers.setSavedChartsData(state, action);
        case Types.ADD_SAVED_CHART_DATA:
            return reducers.addSavedChartData(state, action);
        case Types.UPDATE_SAVED_CHART_DATA:
            return reducers.updateSavedChartData(state, action);
        case Types.REMOVE_SAVED_CHART_DATA:
            return reducers.removeSavedChartData(state, action);
        default:
            return state;
    }
}

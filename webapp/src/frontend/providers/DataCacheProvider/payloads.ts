import { type SavedChart } from "../../models/SavedChart";

import { type Types } from "./types";

export interface SetSavedChartsData {
    type: Types.SET_SAVED_CHARTS_DATA;
    savedCharts: SavedChart[];
}

export interface AddSavedChartData {
    type: Types.ADD_SAVED_CHART_DATA;
    savedChart: SavedChart;
}

export interface UpdateSavedChartData {
    type: Types.UPDATE_SAVED_CHART_DATA;
    slug: string;
    update: Partial<SavedChart>;
}

export interface RemoveSavedChartData {
    type: Types.REMOVE_SAVED_CHART_DATA;
    slug: string;
}

export type All = SetSavedChartsData | AddSavedChartData | UpdateSavedChartData | RemoveSavedChartData;

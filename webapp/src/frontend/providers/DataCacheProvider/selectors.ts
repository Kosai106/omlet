import { type SavedChart } from "../../models/SavedChart";

import { type DataCacheState } from "./DataCacheState";

export function getSelectors(state: DataCacheState) {
    return {
        getSavedChartsData(): SavedChart[] | null {
            const { savedCharts } = state;
            return savedCharts;
        },
    };
}

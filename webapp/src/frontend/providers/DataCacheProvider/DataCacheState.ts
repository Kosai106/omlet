import { type SavedChart } from "../../models/SavedChart";

export interface DataCacheState {
    savedCharts: SavedChart[] | null;
}

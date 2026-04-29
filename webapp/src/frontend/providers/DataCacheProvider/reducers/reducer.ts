import { type DataCacheState } from "../DataCacheState";
import { type All } from "../payloads";

import { reducer as storeReducer } from "./storeReducer";

const reducers = [storeReducer];

export function reducer(state: DataCacheState, action: All) {
    return reducers.reduce((newState, reducer) => reducer(newState, action) ?? newState, state);
}

import { type All } from "../payloads";
import { type UserPreferences } from "../UserPreferences";

import { reducer as storageReducer } from "./storageReducer";
import { reducer as storeReducer } from "./storeReducer";

const reducers = [storeReducer, storageReducer];

export function reducer(state: UserPreferences, action: All) {
    return reducers.reduce((newState, reducer) => reducer(newState, action) ?? newState, state);
}

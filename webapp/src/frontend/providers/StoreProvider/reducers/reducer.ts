import { type All } from "../payloads";
import { type State } from "../State";

import { reducer as apiReducer } from "./apiReducer";
import { reducer as storeReducer } from "./storeReducer";

const reducers = [storeReducer, apiReducer];

export function reducer(state: State, action: All) {
    return reducers.reduce((newState, reducer) => reducer(newState, action), state);
}

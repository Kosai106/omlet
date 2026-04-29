import { type All } from "../payloads";
import { type State } from "../State";

export function reducer(state: State, action: All) {
    switch (action.type) {
        default:
            return state;
    }
}

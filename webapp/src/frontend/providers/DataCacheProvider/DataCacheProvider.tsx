import { type Dispatch, type ReactNode, createContext, useContext, useReducer } from "react";

import { getActions } from "./actions";
import { type DataCacheState } from "./DataCacheState";
import { type All } from "./payloads";
import { reducer } from "./reducers/reducer";
import { getSelectors } from "./selectors";

interface Props {
    children: ReactNode;
}

const initialState: DataCacheState = {
    savedCharts: null,
};

interface Context {
    state: DataCacheState;
    dispatch: Dispatch<All>;
    actions: ReturnType<typeof getActions>;
    selectors: ReturnType<typeof getSelectors>;
}

const DataCacheStateContext = createContext({} as Context);

export function DataCacheProvider({ children }: Props) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const selectors = getSelectors(state);
    const actions = getActions(dispatch);

    return (
        <DataCacheStateContext.Provider value={{ state, dispatch, actions, selectors }}>
            {children}
        </DataCacheStateContext.Provider>
    );
}

export function useDataCacheStore() {
    return useContext(DataCacheStateContext);
}

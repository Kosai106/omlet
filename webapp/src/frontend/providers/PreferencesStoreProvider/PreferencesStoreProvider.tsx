import { type Dispatch, type ReactNode, createContext, useContext, useReducer } from "react";

import { getActions } from "./actions";
import { type All } from "./payloads";
import { reducer } from "./reducers/reducer";
import { getSelectors } from "./selectors";
import { USER_PREFERENCES_DEFAULTS } from "./storage";
import { type UserPreferences } from "./UserPreferences";

interface Props {
    children: ReactNode;
}

interface Context {
    state: UserPreferences;
    dispatch: Dispatch<All>;
    actions: ReturnType<typeof getActions>;
    selectors: ReturnType<typeof getSelectors>;
}

const PreferencesContext = createContext({} as Context);

export function PreferencesStoreProvider({ children }: Props) {
    const [state, dispatch] = useReducer(reducer, USER_PREFERENCES_DEFAULTS);

    const selectors = getSelectors(state);
    const actions = getActions(dispatch);

    return (
        <PreferencesContext.Provider value={{ state, dispatch, actions, selectors }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferencesStore() {
    return useContext(PreferencesContext);
}

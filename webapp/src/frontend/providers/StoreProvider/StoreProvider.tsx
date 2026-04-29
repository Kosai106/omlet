import { type Dispatch, type ReactNode, createContext, useContext, useReducer } from "react";

import { AccessLevel } from "../../models/AccessLevel";

import { getActions } from "./actions";
import { type All } from "./payloads";
import { reducer } from "./reducers/reducer";
import { getSelectors } from "./selectors";
import { type State } from "./State";

interface Props {
    children: ReactNode;
}

const initialState: State = {
    user: null,
    workspace: null,
    members: null,
    accessLevel: AccessLevel.None,
    isCreateNewAnalysisButtonVisible: false,
    isSetupRegularScansDialogVisible: false,
    isScanMoreProjectsDialogVisible: false,
    isAddMoreTagsDialogVisible: false,
    isRenameProjectsDialogVisible: false,
    analyticsURL: "analytics",
    componentsURL: "components",
    dashboardURL: "analytics",
    componentsScrollPosition: undefined,
};

interface Context {
    state: State;
    dispatch: Dispatch<All>;
    actions: ReturnType<typeof getActions>;
    selectors: ReturnType<typeof getSelectors>;
}

const StateContext = createContext({} as Context);

export function StoreProvider({ children }: Props) {
    const [state, dispatch] = useReducer(reducer, initialState);

    const selectors = getSelectors(state);
    const actions = getActions(dispatch);

    return (
        <StateContext.Provider value={{ state, dispatch, actions, selectors }}>
            {children}
        </StateContext.Provider>
    );
}

export function useStore() {
    return useContext(StateContext);
}

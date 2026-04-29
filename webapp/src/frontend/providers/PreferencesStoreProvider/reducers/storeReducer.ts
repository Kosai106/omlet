import {
    type HideSetupSteps,
    type All,
    type InitUserPreferences,
} from "../payloads";
import { Types } from "../types";
import { type UserPreferences } from "../UserPreferences";

const reducers = {
    initUserPreferences(state: UserPreferences, { preferences }: Omit<InitUserPreferences, "type">): UserPreferences {
        return {
            ...state,
            ...preferences,
        };
    },
    hideSetupSteps(state: UserPreferences, { workspaceId }: HideSetupSteps): UserPreferences {
        const { workspacesWithHiddenSetupSteps } = state;
        return {
            ...state,
            workspacesWithHiddenSetupSteps: workspacesWithHiddenSetupSteps.includes(workspaceId) ? workspacesWithHiddenSetupSteps : [...workspacesWithHiddenSetupSteps, workspaceId],
        };
    },
    markDataIssuesSeen(state: UserPreferences): UserPreferences {
        return {
            ...state,
            isDataIssuesDialogSeen: true,
        };
    },
    hideTagsCallout(state: UserPreferences): UserPreferences {
        return {
            ...state,
            isTagsCalloutHidden: true,
        };
    },
};

export function reducer(state: UserPreferences, action: All) {
    switch (action.type) {
        case Types.INIT_USER_PREFERENCES:
            return reducers.initUserPreferences(state, action);
        case Types.HIDE_SETUP_STEPS:
            return reducers.hideSetupSteps(state, action);
        case Types.MARK_DATA_ISSUES_SEEN:
            return reducers.markDataIssuesSeen(state);
        case Types.HIDE_TAGS_CALLOUT:
            return reducers.hideTagsCallout(state);
        default:
            return state;
    }
}

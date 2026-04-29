import { type MarkDataIssuesSeen, type All, type HideSetupSteps, type HideTagsCallout } from "../payloads";
import { userPreferences } from "../storage";
import { Types } from "../types";
import { type UserPreferences } from "../UserPreferences";

const reducers = {
    hideSetupSteps({ workspacesWithHiddenSetupSteps }: UserPreferences, { userId }: HideSetupSteps) {
        userPreferences.set(userId, "workspacesWithHiddenSetupSteps", workspacesWithHiddenSetupSteps);
    },
    markDataIssuesSeen({ isDataIssuesDialogSeen }: UserPreferences, { userId }: MarkDataIssuesSeen) {
        userPreferences.set(userId, "isDataIssuesDialogSeen", isDataIssuesDialogSeen);
    },
    hideTagsCallout({ isTagsCalloutHidden }: UserPreferences, { userId }: HideTagsCallout) {
        userPreferences.set(userId, "isTagsCalloutHidden", isTagsCalloutHidden);
    },
};

export function reducer(state: UserPreferences, action: All) {
    switch (action.type) {
        case Types.HIDE_SETUP_STEPS:
            reducers.hideSetupSteps(state, action);
            break;
        case Types.MARK_DATA_ISSUES_SEEN:
            reducers.markDataIssuesSeen(state, action);
            break;
        case Types.HIDE_TAGS_CALLOUT:
            reducers.hideTagsCallout(state, action);
            break;
        default:
            break;
    }
    return state;
}

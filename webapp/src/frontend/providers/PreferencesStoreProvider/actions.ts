import { type Dispatch } from "react";

import { type All } from "./payloads";
import { Types } from "./types";
import { type UserPreferences } from "./UserPreferences";

export function getActions(dispatch: Dispatch<All>) {
    return {
        initUserPreferences(preferences: UserPreferences) {
            dispatch({
                type: Types.INIT_USER_PREFERENCES,
                preferences,
            });
        },
        hideSetupSteps(userId: string, workspaceId: string) {
            dispatch({
                type: Types.HIDE_SETUP_STEPS,
                userId,
                workspaceId,
            });
        },
        markDataIssuesSeen(userId: string) {
            dispatch({
                type: Types.MARK_DATA_ISSUES_SEEN,
                userId,
            });
        },
        hideTagsCallout(userId: string) {
            dispatch({
                type: Types.HIDE_TAGS_CALLOUT,
                userId,
            });
        },
    };
}

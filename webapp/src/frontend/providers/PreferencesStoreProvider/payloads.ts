import { type Types } from "./types";
import { type UserPreferences } from "./UserPreferences";

export interface InitUserPreferences {
    type: Types.INIT_USER_PREFERENCES;
    preferences: UserPreferences;
}

export interface HideSetupSteps {
    type: Types.HIDE_SETUP_STEPS;
    userId: string;
    workspaceId: string;
}

export interface MarkDataIssuesSeen {
    type: Types.MARK_DATA_ISSUES_SEEN;
    userId: string;
}

export interface HideTagsCallout {
    type: Types.HIDE_TAGS_CALLOUT;
    userId: string;
}

export type All = InitUserPreferences | HideSetupSteps | MarkDataIssuesSeen | HideTagsCallout;

import { type UserPreferences } from "./UserPreferences";

export function getSelectors(preferences: UserPreferences) {
    return {
        getIsSetupStepsVisible(workspaceId: string): boolean {
            return !preferences.workspacesWithHiddenSetupSteps.includes(workspaceId);
        },
        getIsDataIssuesDialogSeen(): boolean {
            return preferences.isDataIssuesDialogSeen;
        },
        getIsTagsCalloutHidden(): boolean {
            return preferences.isTagsCalloutHidden;
        },
    };
}

import { type State } from "./State";

export function getSelectors(state: State) {
    return {
        getUser() {
            const { user } = state;
            return user;
        },
        getWorkspace() {
            const { workspace } = state;
            return workspace;
        },
        getMembers(){
            const { members } = state;
            return members;
        },
        getAccessLevel() {
            const { accessLevel } = state;
            return accessLevel;
        },
        getTags() {
            const { workspace } = state;
            return workspace?.tags ?? [];
        },
        getIsCreateNewAnalysisButtonVisible() {
            const { isCreateNewAnalysisButtonVisible } = state;
            return isCreateNewAnalysisButtonVisible;
        },
        getIsSetupRegularScansDialogVisible() {
            const { isSetupRegularScansDialogVisible } = state;
            return isSetupRegularScansDialogVisible;
        },
        getIsScanMoreProjectsDialogVisible() {
            const { isScanMoreProjectsDialogVisible } = state;
            return isScanMoreProjectsDialogVisible;
        },
        getIsAddMoreTagsDialogVisible() {
            const { isAddMoreTagsDialogVisible } = state;
            return isAddMoreTagsDialogVisible;
        },
        getIsRenameProjectDialogVisible() {
            const { isRenameProjectsDialogVisible } = state;
            return isRenameProjectsDialogVisible;
        },
        getAnalyticsURL() {
            const { analyticsURL } = state;
            return analyticsURL;
        },
        getComponentsURL() {
            const { componentsURL } = state;
            return componentsURL;
        },
        getDashboardURL() {
            const { dashboardURL } = state;
            return dashboardURL;
        },
        getComponentsScrollPosition() {
            const { componentsScrollPosition } = state;
            return componentsScrollPosition;
        },
        getDashboardScrollPosition() {
            const { dashboardScrollPosition } = state;
            return dashboardScrollPosition;
        },
    };
}

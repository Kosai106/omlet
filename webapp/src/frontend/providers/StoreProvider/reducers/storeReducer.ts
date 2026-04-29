import { getColorMap, getNextColor, USER_DEFINED_TAG_COLORS } from "../../../../common/colorUtils";
import { type Tag, RESERVED_TAGS } from "../../../../common/models/Tag";
import { compareProject, compareTag } from "../../../../common/sortUtils";
import { type AddMember, type RemoveMember,
    type SetMembers,
    type All,
    type SetUser,
    type SetWorkspace,
    type SetAnalyticsURL,
    type SetComponentsURL,
    type SetDashboardURL,
    type SetComponentsScrollPosition,
    type SetIsCreateNewAnalysisButtonVisible,
    type SetIsSetupRegularScansDialogVisible,
    type SetIsAddMoreTagsDialogVisible,
    type SetIsScanMoreProjectsDialogVisible,
    type SetTag,
    type DeleteTag,
    type SetTags,
    type SetDashboardScrollPosition,
} from "../payloads";
import { type State } from "../State";
import { Types } from "../types";

function findNextColor(tags: Tag[]) {
    const colorMap = getColorMap(USER_DEFINED_TAG_COLORS, tags.map(t => t.color));
    return getNextColor(colorMap);
}

const reducers = {
    setUser(state: State, { user }: SetUser): State {
        return {
            ...state,
            user,
        };
    },
    setWorkspace(state: State, { workspace, accessLevel }: SetWorkspace): State {
        workspace.projects.sort(compareProject);
        workspace.tags.sort(compareTag);
        return {
            ...state,
            accessLevel,
            workspace,
        };
    },
    setMembers(state: State, { members }: SetMembers): State {
        return {
            ...state,
            workspace: state.workspace && {
                ...state.workspace,
                numOfMembers: members.length,
            },
            members,
        };
    },
    addMember(state: State, { member }: AddMember): State {
        const updatedMembers = [...(state.members ?? []), member];
        return {
            ...state,
            workspace: state.workspace && {
                ...state.workspace,
                numOfMembers: updatedMembers.length,
            },
            members: updatedMembers,
        };
    },
    removeMember(state: State, { userId }: RemoveMember): State {
        const updatedMembers = (state.members ?? []).filter(m => m.user.id !== userId);
        return {
            ...state,
            workspace: state.workspace && {
                ...state.workspace,
                numOfMembers: updatedMembers.length,
            },
            members: updatedMembers,
        };
    },
    setTags(state: State, { tags }: SetTags): State {
        const sortedTags = [...tags];
        sortedTags.sort(compareTag);
        return {
            ...state,
            workspace: {
                ...state.workspace!,
                tags: sortedTags,
            },
        };
    },
    setTag(state: State, { tag }: SetTag): State {
        const tags = [...state.workspace!.tags];
        const index = tags.findIndex(t => t.slug === tag.slug);
        if (index >= 0) {
            tags[index] = tag;
        } else if (tag.slug === RESERVED_TAGS.CORE.slug) {
            tags.unshift(tag);
        } else {
            tag.color = findNextColor(state.workspace!.tags);
            tags.push(tag);
        }
        tags.sort(compareTag);
        return {
            ...state,
            workspace: {
                ...state.workspace!,
                tags,
            },
        };
    },
    deleteTag(state: State, { slug }: DeleteTag): State {
        const tags = state.workspace!.tags.filter(t => t.slug !== slug);
        return {
            ...state,
            workspace: {
                ...state.workspace!,
                tags,
            },
        };
    },
    setIsCreateNewAnalysisButtonVisible(state: State, { isCreateNewAnalysisButtonVisible }: SetIsCreateNewAnalysisButtonVisible): State {
        return {
            ...state,
            isCreateNewAnalysisButtonVisible,
        };
    },
    setIsSetupRegularScansDialogVisible(state: State, { isSetupRegularScansDialogVisible }: SetIsSetupRegularScansDialogVisible): State {
        return {
            ...state,
            isSetupRegularScansDialogVisible,
        };
    },
    setIsScanMoreProjectsDialogVisible(state: State, { isScanMoreProjectsDialogVisible }: SetIsScanMoreProjectsDialogVisible): State {
        return {
            ...state,
            isScanMoreProjectsDialogVisible,
        };
    },
    setIsAddMoreTagsDialogVisible(state: State, { isAddMoreTagsDialogVisible }: SetIsAddMoreTagsDialogVisible): State {
        return {
            ...state,
            isAddMoreTagsDialogVisible,
        };
    },
    openRenameProjectsDialog(state: State) {
        return {
            ...state,
            isRenameProjectsDialogVisible: true,
        };
    },
    closeRenameProjectsDialog(state: State) {
        return {
            ...state,
            isRenameProjectsDialogVisible: false,
        };
    },
    setAnalyticsURL(state: State, { url }: SetAnalyticsURL): State {
        return {
            ...state,
            analyticsURL: url,
        };
    },
    setComponentsURL(state: State, { url }: SetComponentsURL): State {
        return {
            ...state,
            componentsURL: url,
        };
    },
    setDashboardURL(state: State, { url }: SetDashboardURL): State {
        return {
            ...state,
            dashboardURL: url,
        };
    },
    setComponentsScrollPosition(state: State, { position }: SetComponentsScrollPosition): State {
        return {
            ...state,
            componentsScrollPosition: position,
        };
    },
    setDashboardScrollPosition(state: State, { position }: SetDashboardScrollPosition): State {
        return {
            ...state,
            dashboardScrollPosition: position,
        };
    },
};

export function reducer(state: State, action: All) {
    switch (action.type) {
        case Types.SET_USER:
            return reducers.setUser(state, action);
        case Types.SET_WORKSPACE:
            return reducers.setWorkspace(state, action);
        case Types.SET_MEMBERS:
            return reducers.setMembers(state, action);
        case Types.ADD_MEMBER:
            return reducers.addMember(state, action);
        case Types.REMOVE_MEMBER:
            return reducers.removeMember(state, action);
        case Types.SET_TAGS:
            return reducers.setTags(state, action);
        case Types.SET_TAG:
            return reducers.setTag(state, action);
        case Types.DELETE_TAG:
            return reducers.deleteTag(state, action);
        case Types.SET_IS_CREATE_NEW_ANALYSIS_BUTTON_VISIBLE:
            return reducers.setIsCreateNewAnalysisButtonVisible(state, action);
        case Types.SET_IS_SETUP_REGULAR_SCANS_DIALOG_VISIBLE:
            return reducers.setIsSetupRegularScansDialogVisible(state, action);
        case Types.SET_IS_SCAN_MORE_PROJECTS_DIALOG_VISIBLE:
            return reducers.setIsScanMoreProjectsDialogVisible(state, action);
        case Types.SET_IS_ADD_MORE_TAGS_DIALOG_VISIBLE:
            return reducers.setIsAddMoreTagsDialogVisible(state, action);
        case Types.OPEN_RENAME_PROJECTS_DIALOG:
            return reducers.openRenameProjectsDialog(state);
        case Types.CLOSE_RENAME_PROJECTS_DIALOG:
            return reducers.closeRenameProjectsDialog(state);
        case Types.SET_ANALYTICS_URL:
            return reducers.setAnalyticsURL(state, action);
        case Types.SET_COMPONENTS_URL:
            return reducers.setComponentsURL(state, action);
        case Types.SET_DASHBOARD_URL:
            return reducers.setDashboardURL(state, action);
        case Types.SET_COMPONENTS_SCROLL_POSITION:
            return reducers.setComponentsScrollPosition(state, action);
        case Types.SET_DASHBOARD_SCROLL_POSITION:
            return reducers.setDashboardScrollPosition(state, action);
        default:
            return state;
    }
}

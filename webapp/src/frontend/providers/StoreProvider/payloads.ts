
import { type Tag } from "../../../common/models/Tag";
import { type AccessLevel } from "../../models/AccessLevel";
import { type Member } from "../../models/Member";
import { type User } from "../../models/User";
import { type Workspace } from "../../models/Workspace";

import { type Types } from "./types";

export interface SetUser {
    type: Types.SET_USER;
    user: User;
}

export interface SetWorkspace {
    type: Types.SET_WORKSPACE;
    workspace: Workspace;
    accessLevel: AccessLevel;
}

export interface SetTags {
    type: Types.SET_TAGS;
    tags: Tag[];
}

export interface SetTag {
    type: Types.SET_TAG;
    tag: Tag;
}

export interface DeleteTag {
    type: Types.DELETE_TAG;
    slug: string;
}

export interface SetIsCreateNewAnalysisButtonVisible {
    type: Types.SET_IS_CREATE_NEW_ANALYSIS_BUTTON_VISIBLE;
    isCreateNewAnalysisButtonVisible: boolean;
}

export interface SetIsSetupRegularScansDialogVisible {
    type: Types.SET_IS_SETUP_REGULAR_SCANS_DIALOG_VISIBLE;
    isSetupRegularScansDialogVisible: boolean;
}

export interface SetIsScanMoreProjectsDialogVisible {
    type: Types.SET_IS_SCAN_MORE_PROJECTS_DIALOG_VISIBLE;
    isScanMoreProjectsDialogVisible: boolean;
}

export interface SetIsAddMoreTagsDialogVisible {
    type: Types.SET_IS_ADD_MORE_TAGS_DIALOG_VISIBLE;
    isAddMoreTagsDialogVisible: boolean;
}

export interface OpenRenameProjectsDialog {
    type: Types.OPEN_RENAME_PROJECTS_DIALOG;
}

export interface CloseRenameProjectsDialog {
    type: Types.CLOSE_RENAME_PROJECTS_DIALOG;
}

export interface SetAnalyticsURL {
    type: Types.SET_ANALYTICS_URL;
    url: string;
}

export interface SetComponentsURL {
    type: Types.SET_COMPONENTS_URL;
    url: string;
}

export interface SetDashboardURL {
    type: Types.SET_DASHBOARD_URL;
    url: string;
}

export interface SetComponentsScrollPosition {
    type: Types.SET_COMPONENTS_SCROLL_POSITION;
    position: number | undefined;
}

export interface SetDashboardScrollPosition {
    type: Types.SET_DASHBOARD_SCROLL_POSITION;
    position: number | undefined;
}

export interface SetMembers {
    type: Types.SET_MEMBERS;
    members: Member[];
}

export interface AddMember {
    type: Types.ADD_MEMBER;
    member: Member;
}

export interface RemoveMember {
    type: Types.REMOVE_MEMBER;
    userId: string;
}

export type All =
    SetUser | SetWorkspace | SetTags | SetTag | DeleteTag |
    SetIsCreateNewAnalysisButtonVisible | SetIsSetupRegularScansDialogVisible | SetIsScanMoreProjectsDialogVisible | SetIsAddMoreTagsDialogVisible |
    SetAnalyticsURL | SetComponentsURL | SetDashboardURL | SetComponentsScrollPosition | SetDashboardScrollPosition |
    OpenRenameProjectsDialog | CloseRenameProjectsDialog |
    SetMembers | AddMember | RemoveMember;

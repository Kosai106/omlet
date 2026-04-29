import { type Dispatch } from "react";

import { type Tag } from "../../../common/models/Tag";
import { type AccessLevel } from "../../models/AccessLevel";
import { type Member } from "../../models/Member";
import { type User } from "../../models/User";
import { type Workspace } from "../../models/Workspace";

import { type All } from "./payloads";
import { Types } from "./types";

export function getActions(dispatch: Dispatch<All>) {
    return {
        setUser(user: User) {
            dispatch({
                type: Types.SET_USER,
                user,
            });
        },
        setWorkspace(workspace: Workspace, accessLevel: AccessLevel) {
            dispatch({
                type: Types.SET_WORKSPACE,
                workspace,
                accessLevel,
            });
        },
        setMembers(members: Member[]) {
            dispatch({
                type: Types.SET_MEMBERS,
                members,
            });
        },
        addMember(member: Member) {
            dispatch({
                type: Types.ADD_MEMBER,
                member,
            });
        },
        removeMember(userId: string) {
            dispatch({
                type: Types.REMOVE_MEMBER,
                userId,
            });
        },
        setTags(tags: Tag[]) {
            dispatch({
                type: Types.SET_TAGS,
                tags,
            });
        },
        setTag(tag: Tag) {
            dispatch({
                type: Types.SET_TAG,
                tag,
            });
        },
        deleteTag(slug: string) {
            dispatch({
                type: Types.DELETE_TAG,
                slug,
            });
        },
        setIsCreateNewAnalysisButtonVisible(isCreateNewAnalysisButtonVisible: boolean) {
            dispatch({
                type: Types.SET_IS_CREATE_NEW_ANALYSIS_BUTTON_VISIBLE,
                isCreateNewAnalysisButtonVisible,
            });
        },
        setIsSetupRegularScansDialogVisible(isSetupRegularScansDialogVisible: boolean) {
            dispatch({
                type: Types.SET_IS_SETUP_REGULAR_SCANS_DIALOG_VISIBLE,
                isSetupRegularScansDialogVisible,
            });
        },
        setIsScanMoreProjectsDialogVisible(isScanMoreProjectsDialogVisible: boolean) {
            dispatch({
                type: Types.SET_IS_SCAN_MORE_PROJECTS_DIALOG_VISIBLE,
                isScanMoreProjectsDialogVisible,
            });
        },
        setIsAddMoreTagsDialogVisible(isAddMoreTagsDialogVisible: boolean) {
            dispatch({
                type: Types.SET_IS_ADD_MORE_TAGS_DIALOG_VISIBLE,
                isAddMoreTagsDialogVisible,
            });
        },
        openRenameProjectsDialog() {
            dispatch({
                type: Types.OPEN_RENAME_PROJECTS_DIALOG,
            });
        },
        closeRenameProjectsDialog() {
            dispatch({
                type: Types.CLOSE_RENAME_PROJECTS_DIALOG,
            });
        },
        setAnalyticsURL(url: string) {
            dispatch({
                type: Types.SET_ANALYTICS_URL,
                url,
            });
        },
        setComponentsURL(url: string) {
            dispatch({
                type: Types.SET_COMPONENTS_URL,
                url,
            });
        },
        setDashboardURL(url: string) {
            dispatch({
                type: Types.SET_DASHBOARD_URL,
                url,
            });
        },
        setComponentsScrollPosition(position: number | undefined) {
            dispatch({
                type: Types.SET_COMPONENTS_SCROLL_POSITION,
                position,
            });
        },
        setDashboardScrollPosition(position: number | undefined) {
            dispatch({
                type: Types.SET_DASHBOARD_SCROLL_POSITION,
                position,
            });
        },
    };
}

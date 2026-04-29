import { type AccessLevel } from "../../models/AccessLevel";
import { type Member } from "../../models/Member";
import { type User } from "../../models/User";
import { type Workspace } from "../../models/Workspace";

export interface State {
    user: User | null;
    workspace: Workspace | null;
    members: Member[] | null;
    accessLevel: AccessLevel;
    isCreateNewAnalysisButtonVisible: boolean;
    isSetupRegularScansDialogVisible: boolean;
    isScanMoreProjectsDialogVisible: boolean;
    isAddMoreTagsDialogVisible: boolean;
    isRenameProjectsDialogVisible: boolean;
    analyticsURL: string;
    componentsURL: string;
    dashboardURL: string;
    componentsScrollPosition?: number;
    dashboardScrollPosition?: number;
}

import { config } from "../../config/backend";

import { ServiceError } from "./error";

class EmailClient {
    sendEmail(..._args: unknown[]) {
        // emailing service dependent code
    }
}

let client: EmailClient | undefined = undefined;

export function initEmailing() {
    if (!config.EMAILS_ENABLED) {
        return;
    }

    client = new EmailClient();
}

class EmailFailure extends ServiceError {
    constructor({ templateId, templateModel, receiver }: { templateId: number; templateModel: object; receiver: string; }) {
        super("Sending email failed", {
            details: {
                templateId,
                templateModel,
                receiver,
            },
        });
    }
}

async function sendEmail(receiver: string, templateId: string, templateModel = {}) {
    if (!client) {
        return;
    }

    try {
        await client.sendEmail(receiver, templateId, templateModel);
    } catch (error) {
        throw EmailFailure.fromError(error as Error, {
            templateId,
            templateModel,
            receiver,
        });
    }
}

interface InviteEmailData {
    inviteUrl: string;
    referrerEmail: string;
    referrerName?: string;
}

const INVITE_EMAIL_TEMPLATE_ID = "user-invitation-1";
export function sendInviteEmail(to: string, modelData: InviteEmailData) {
    return sendEmail(to, INVITE_EMAIL_TEMPLATE_ID, modelData);
}

const INVITE_TO_SCAN_EMAIL_TEMPLATE_ID = "user-invitation-2";
export function sendInviteToScanEmail(to: string, modelData: InviteEmailData) {
    return sendEmail(to, INVITE_TO_SCAN_EMAIL_TEMPLATE_ID, modelData);
}

interface WorkspaceJoinEmailData {
    workspaceUrl: string;
    referrerEmail: string;
    referrerName?: string;
}

const WORKSPACE_JOIN_EMAIL_TEMPLATE_ID = "workspace-join";
export function sendWorkspaceJoinEmail(to: string, modelData: WorkspaceJoinEmailData) {
    return sendEmail(to, WORKSPACE_JOIN_EMAIL_TEMPLATE_ID, modelData);
}

interface WorkspaceJoinRequestEmailData {
    workspaceUrl: string;
    ownerName?: string;
    requesterEmail: string;
}

const WORKSPACE_JOIN_REQUEST_EMAIL_TEMPLATE_ID = "workspace-join-request";
export function sendWorkspaceJoinRequestEmail(to: string, modelData: WorkspaceJoinRequestEmailData) {
    return sendEmail(to, WORKSPACE_JOIN_REQUEST_EMAIL_TEMPLATE_ID, modelData);
}

interface WorkspaceJoinRequestAlreadyExistsEmailData {
    requesterEmail: string;
}

const WORKSPACE_JOIN_REQUEST_ALREADY_EXISTS_EMAIL_TEMPLATE_ID = "workspace-join-request-already-exists";
export function sendWorkspaceJoinRequestAlreadyExistsEmail(to: string, modelData: WorkspaceJoinRequestAlreadyExistsEmailData) {
    return sendEmail(to, WORKSPACE_JOIN_REQUEST_ALREADY_EXISTS_EMAIL_TEMPLATE_ID, modelData);
}

interface WorkspaceJoinRequestAlreadyMemberEmailData {
    workspaceUrl: string;
    requesterEmail: string;
}

const WORKSPACE_JOIN_REQUEST_ALREADY_MEMBER_EMAIL_TEMPLATE_ID = "workspace-join-request-already-member";
export function sendWorkspaceJoinRequestAlreadyMemberEmail(to: string, modelData: WorkspaceJoinRequestAlreadyMemberEmailData) {
    return sendEmail(to, WORKSPACE_JOIN_REQUEST_ALREADY_MEMBER_EMAIL_TEMPLATE_ID, modelData);
}

const WELCOME_EMAIL_TEMPLATE_ID = "welcome-1";
export function sendWelcomeEmail(to: string) {
    return sendEmail(to, WELCOME_EMAIL_TEMPLATE_ID);
}

interface LoginEmailData {
    loginUrl: string;
}

const LOGIN_EMAIL_TEMPLATE_ID = "login";
export function sendLoginEmail(to: string, modelData: LoginEmailData) {
    return sendEmail(to, LOGIN_EMAIL_TEMPLATE_ID, modelData);
}

interface EmailChangeEmailData {
    emailChangeUrl: string;
    email: string;
}

const EMAIL_CHANGE_EMAIL_TEMPLATE_ID = "email-change";
export function sendEmailChangeEmail(to: string, modelData: EmailChangeEmailData) {
    return sendEmail(to, EMAIL_CHANGE_EMAIL_TEMPLATE_ID, modelData);
}

interface EmailChangeNotificationEmailData {
    oldEmail: string;
    newEmail: string;
}

const EMAIL_CHANGE_NOTIFICATION_EMAIL_TEMPLATE_ID = "email-change-notification";
export function sendEmailChangeNotificationEmail(to: string, modelData: EmailChangeNotificationEmailData) {
    return sendEmail(to, EMAIL_CHANGE_NOTIFICATION_EMAIL_TEMPLATE_ID, modelData);
}

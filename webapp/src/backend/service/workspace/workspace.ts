import { Types as MongooseTypes } from "mongoose";

import { getColorMap, getNextColor, USER_DEFINED_TAG_COLORS } from "../../../common/colorUtils";
import { type FilterDataType } from "../../../common/models/FilterDataType";
import { FilterOperation } from "../../../common/models/FilterOperation";
import { DEFAULT_HTML_ELEMENT_MAP } from "../../../common/models/htmlElementMap";
import { generateSlug } from "../../../common/utils";
import { config } from "../../../config/backend";
import {
    getAnalysisCountForWorkspace,
    purgeAnalysesForWorkspace,
    updateComponentTagsInAnalysis,
} from "../analysis/analysis";
import { type AuthData, type PublicAuthData } from "../auth/auth";
import { withAnalysisWriteLock } from "../cache/cache";
import { getLatestIndexAnalysisId, purgeAllComponentDataForWorkspace, recalculateTags, RESERVED_TAGS } from "../component/component";
import { purgeDataIssuesForWorkspace } from "../dataIssues/dataIssues";
import { ServiceError } from "../error";
import { type RepositorySubDoc } from "../models";
import { findUserByEmail, findUserById, getMultipleUsers, type User } from "../user/user";
import { escapeRegex, generateNanoId, unescapeRegex } from "../utils";

import {
    type ComponentTagDoc,
    type ComponentTagFilterDoc,
    type ProjectDoc,
    type TreeNodeDoc,
    type WorkspaceDoc,
    type WorkspaceInviteDoc,
    type WorkspaceInviteLinkDoc,
    WorkspaceInviteLinkModel,
    WorkspaceInviteLinkUsageModel,
    WorkspaceInviteModel,
    type WorkspaceJoinRequestDoc,
    WorkspaceJoinRequestModel,
    WorkspaceModel,
} from "./models";

export enum UserPermission {
    READ,
    WRITE,
}

export class UserNotAuthorized extends ServiceError {
    constructor() {
        super("User not authorized");
    }
}

export class WorkspaceNotFound extends ServiceError {
    constructor({ workspace }: { workspace: string; }) {
        super("Workspace not found", {
            details: {
                workspace,
            },
        });
    }
}

export class TagNotFound extends ServiceError {
    constructor({ workspace, tag }: { workspace: string; tag: string; }) {
        super("Tag not found", {
            details: {
                workspace,
                tag,
            },
        });
    }
}

export class NewMemberNotFound extends ServiceError {
    constructor({ workspace, userId }: { workspace: string; userId: string; }) {
        super("No user found for the new member", {
            details: {
                workspace,
                userId,
            },
        });
    }
}

export class UserAlreadyMember extends ServiceError {
    constructor({ workspace, userId, email }: { workspace: string; userId: string; email: string; }) {
        super("Invited user already a member", {
            details: {
                workspace,
                userId,
                invitedEmail: email,
            },
        });
    }
}

export class UserAlreadyInvited extends ServiceError {
    constructor({ email }: { email: string; }) {
        super("User is already invited", {
            details: {
                invitedEmail: email,
            },
        });
    }
}

export class WorkspaceInviteLinkNotFound extends ServiceError {
    constructor({ workspace, code }: { workspace: string; code?: string; }) {
        super("Workspace invite link not found", {
            details: {
                workspace,
                code,
            },
        });
    }
}

export class WorkspaceInviteLinkNotActive extends ServiceError {
    constructor({ workspace, code }: { workspace: string; code: string; }) {
        super("Workspace invite link is not active", {
            details: {
                workspace,
                code,
            },
        });
    }
}

export class WorkspaceJoinRequestNotFound extends ServiceError {
    constructor({ workspaceJoinRequest }: { workspaceJoinRequest: string; }) {
        super("Workspace join request not found", {
            details: {
                workspaceJoinRequest,
            },
        });
    }
}

export class WorkspaceJoinRequestAlreadyExists extends ServiceError {
    constructor({ workspace, email }: { workspace: string; email: string; }) {
        super("Workspace join request already exists", {
            details: {
                workspace,
                email,
            },
        });
    }
}

export class UserAlreadyRegistered extends ServiceError {
    constructor({ workspace, userId, email }: { workspace: string; userId: string; email: string; }) {
        super("Invited user already registered", {
            details: {
                workspace,
                userId,
                invitedEmail: email,
            },
        });
    }
}

export class WorkspaceSlugNotAvailable extends ServiceError {
    constructor() {
        super("Workspace slug is already in use");
    }
}

export class WorkspaceAlreadySetup extends ServiceError {
    constructor() {
        super("Workspace has already been set up");
    }
}

export class MemberNotFound extends ServiceError {
    constructor({ workspace, userId }: { workspace: string; userId?: string; }) {
        super("User is not a member", {
            details: {
                workspace,
                userId,
            },
        });
    }
}

export class ProjectNotFound extends ServiceError {
    constructor({ workspace, projectName }: { workspace: string; projectName: string; }) {
        super("Project does not exist", {
            details: {
                workspace,
                projectName,
            },
        });
    }
}

export class ProjectNotInternal extends ServiceError {
    constructor({ workspace, projectName }: { workspace: string; projectName: string; }) {
        super("Project is not internal", {
            details: {
                workspace,
                projectName,
            },
        });
    }
}

export class ProjectAliasAlreadyExists extends ServiceError {
    constructor({ workspace, alias }: { workspace: string; alias: string; }) {
        super("Project alias already exists", {
            details: {
                workspace,
                alias,
            },
        });
    }
}

export class UserNotHaveWorkspace extends ServiceError {
    constructor({ userId }: { userId: string; }) {
        super("User doesn't have a workspace", {
            details: {
                userId,
            },
        });
    }
}

function generateInviteCode(): string {
    return generateNanoId();
}

export class Project {
    slug: string;
    name: string;
    alias: string;
    packageName: string;
    isInternal: boolean;
    repository?: RepositorySubDoc;

    constructor(props: ProjectDoc) {
        this.slug = props.slug;
        this.name = props.name;
        this.alias = props.alias;
        this.packageName = props.packageName;
        this.isInternal = props.isInternal;
        this.repository = props.repository;
    }

    static fromDoc(doc: ProjectDoc): Project {
        return new Project(doc);
    }

    toResponse() {
        return {
            slug: this.slug,
            packageName: this.packageName,
            alias: this.alias,
            name: this.name,
            isInternal: this.isInternal,
            repository: this.repository,
        };
    }
}

export class Workspace {
    id: string;
    name: string;
    slug: string;
    isPublic: boolean;
    createdBy: string;
    members: {
        user: string;
        joinedAt: Date;
    }[];
    projects: Project[];
    tags: ComponentTag[];
    htmlElementMap: Record<string, string>;
    createdAt: Date;
    numOfComponents: number;

    constructor(props: WorkspaceDoc) {
        this.id = props._id.toHexString();
        this.name = props.name;
        this.slug = props.slug;
        this.isPublic = props.isPublic;
        this.createdBy = props.createdBy.toHexString();
        this.members = props.members.map(member => ({ user: member.user.toHexString(), joinedAt: member.joinedAt }));
        this.projects = props.projects.map(project => Project.fromDoc(project));
        this.tags = props.tags.map(tag => ComponentTag.fromDoc(tag));
        this.htmlElementMap = props.htmlElementMap ?? {};
        this.createdAt = props.createdAt;
        this.numOfComponents = props.numOfComponents;
    }

    static fromDoc(doc: WorkspaceDoc): Workspace {
        return new Workspace(doc);
    }

    isUserMember(userId: string): boolean {
        return this.members.some(member => member.user === userId);
    }

    getAccessLevel(auth?: AuthData): AccessLevel {
        const isMember = auth !== undefined && this.isUserMember(auth.userId);

        if (isMember) {
            return AccessLevel.Full;
        }

        // UserPermission.READ
        if (auth?.isAdmin || this.isPublic) {
            return AccessLevel.ReadOnly;
        }

        return AccessLevel.Page;
    }

    getTagLimit(): number {
        return 999;
    }

    getTotalComponentLimit(): number {
        return 999;
    }

    getTags() {
        return this.tags;
    }

    get baseUrl() {
        return `${config.APP_BASE_URL}/${this.slug}`;
    }


    tagsToResponse() {
        const tags = this.tags.map(tag => tag.toResponse());

        return [...tags, RESERVED_TAGS.EXTERNAL];
    }

    async toResponse() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug,
            createdBy: this.createdBy,
            projects: this.projects.map(project => project.toResponse()),
            tags: this.tagsToResponse(),
            htmlElementMap: { ...DEFAULT_HTML_ELEMENT_MAP, ...this.htmlElementMap },
            numOfMembers: this.members.length,
            numOfComponents: this.numOfComponents,
            numOfAnalyses: await getAnalysisCountForWorkspace(this.id),
        };
    }
}

class Member {
    constructor(public user: User) {}

    toResponse() {
        return {
            user: this.user.toResponse(),
        };
    }
}

export class WorkspaceInvite {
    id: string;
    code: string;
    email: string;
    expiresAt: Date;
    isUsed: boolean;
    workspaceId: string;

    constructor(invite: WorkspaceInviteDoc) {
        this.id = invite._id.toHexString();
        this.email = invite.email;
        this.expiresAt = invite.expiresAt;
        this.code = invite.code;
        this.isUsed = invite.isUsed;
        this.workspaceId = invite.workspace.toHexString();
    }

    static fromDoc(doc: WorkspaceInviteDoc): WorkspaceInvite {
        return new WorkspaceInvite(doc);
    }

    toResponse() {
        return {
            id: this.id,
            email: this.email,
            expiresAt: this.expiresAt,
        };
    }
}

export class WorkspaceInviteLink {
    id: string;
    code: string;
    workspace: string;
    numberUsed: number;
    isActive: boolean;

    constructor(doc: WorkspaceInviteLinkDoc) {
        this.id = doc._id.toHexString();
        this.code = doc.code;
        this.workspace = doc.workspace.toHexString();
        this.numberUsed = doc.numberUsed;
        this.isActive = doc.isActive;
    }

    static fromDoc(doc: WorkspaceInviteLinkDoc): WorkspaceInviteLink {
        return new WorkspaceInviteLink(doc);
    }
}

export class WorkspaceJoinRequest {
    id: string;
    workspace: string;
    email: string;

    constructor(doc: WorkspaceJoinRequestDoc) {
        this.id = doc._id.toHexString();
        this.workspace = doc.workspace.toHexString();
        this.email = doc.email;
    }

    static fromDoc(doc: WorkspaceJoinRequestDoc): WorkspaceJoinRequest {
        return new WorkspaceJoinRequest(doc);
    }

    toResponse() {
        return {
            id: this.id,
            email: this.email,
        };
    }
}

function unescapeRegexValues(doc: ComponentTagFilterDoc): string[] {
    if (
        [
            FilterOperation.Equals, FilterOperation.IsNotEqual,
            FilterOperation.Regex,
            FilterOperation.GreaterThan, FilterOperation.LessThan,
        ].includes(doc.operation)
    ) {
        return doc.value;
    }

    return doc.value.map(value => unescapeRegex(value));
}

export class ComponentTagFilter {
    field: string;
    dataType: FilterDataType;
    operation: FilterOperation;
    value: string[];

    constructor({ field, dataType, operation, value }: ComponentTagFilterDoc) {
        this.field = field;
        this.dataType = dataType;
        this.operation = operation;
        this.value = value;
    }

    static fromDoc(doc: ComponentTagFilterDoc): ComponentTagFilter {
        return new ComponentTagFilter({
            field: doc.field,
            dataType: doc.dataType,
            operation: doc.operation,
            value: unescapeRegexValues(doc),
        });
    }

    valueToDoc(): string[] {
        if (
            [
                FilterOperation.Equals, FilterOperation.IsNotEqual,
                FilterOperation.Regex,
                FilterOperation.GreaterThan, FilterOperation.LessThan,
            ].includes(this.operation)
        ) {
            return this.value;
        }

        return this.value.map(value => escapeRegex(value));
    }

    toDoc(): ComponentTagFilterDoc {
        return {
            field: this.field,
            dataType: this.dataType,
            operation: this.operation,
            value: this.valueToDoc(),
        };
    }

    toResponse() {
        return {
            field: this.field,
            dataType: this.dataType,
            operation: this.operation,
            value: this.value,
        };
    }
}

export interface TreeNodeData {
    path: string;
    packageName: string;
}

export class TreeNode {
    path: string;
    packageName: string;

    constructor({ path, packageName }: TreeNodeDoc) {
        this.path = path;
        this.packageName = packageName;
    }

    startsWith(other: TreeNode): boolean {
        return this.packageName === other.packageName && this.path.startsWith(other.path);
    }

    equals(other: TreeNode): boolean {
        return this.packageName === other.packageName && this.path === other.path;
    }

    static fromDoc(doc: TreeNodeDoc) {
        return new TreeNode({
            packageName: doc.packageName,
            path: unescapeRegex(doc.path),
        });
    }

    toDoc(): TreeNodeDoc {
        return {
            packageName: this.packageName,
            path: escapeRegex(this.path),
        };
    }

    toResponse() {
        return {
            packageName: this.packageName,
            path: this.path,
        };
    }
}

export class ComponentTag {
    slug: string;
    name: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    searchTerm: string;
    selectedTreeNodes: TreeNode[];
    deselectedTreeNodes: TreeNode[];
    filters: ComponentTagFilter[];

    constructor({ slug, name, color, createdAt, updatedAt, searchTerm, selectedTreeNodes, deselectedTreeNodes, filters }: {
        slug: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        searchTerm: string;
        selectedTreeNodes: TreeNode[];
        deselectedTreeNodes: TreeNode[];
        filters: ComponentTagFilter[];
    }) {
        this.slug = slug;
        this.name = name;
        this.color = color;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.searchTerm = searchTerm;
        this.selectedTreeNodes = selectedTreeNodes;
        this.deselectedTreeNodes = deselectedTreeNodes;
        this.filters = filters;
    }

    static fromDoc(doc: ComponentTagDoc): ComponentTag {
        return new ComponentTag({
            name: doc.name,
            slug: doc.slug,
            color: doc.color,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            searchTerm: doc.searchTerm?.map(term => unescapeRegex(term)).join(" ") ?? "",
            selectedTreeNodes: doc.selectedTreeNodes.map(treeNodeDoc => TreeNode.fromDoc(treeNodeDoc)),
            deselectedTreeNodes: doc.deselectedTreeNodes.map(treeNodeDoc => TreeNode.fromDoc(treeNodeDoc)),
            filters: doc.filters.map(filter => ComponentTagFilter.fromDoc(filter)),
        });
    }

    searchTermToDoc(): string[] {
        if (this.searchTerm === "") {
            return [];
        }

        return this.searchTerm.split(/\s+/).map(t => escapeRegex(t));
    }

    toDoc(): ComponentTagDoc {
        return {
            name: this.name,
            slug: this.slug,
            color: this.color,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            searchTerm: this.searchTermToDoc(),
            selectedTreeNodes: this.selectedTreeNodes.map(treeNode => treeNode.toDoc()),
            deselectedTreeNodes: this.deselectedTreeNodes.map(treeNode => treeNode.toDoc()),
            filters: this.filters.map(filter => filter.toDoc()),
        };
    }

    toResponse() {
        return {
            name: this.name,
            slug: this.slug,
            color: this.color,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            searchTerm: this.searchTerm,
            selectedTreeNodes: this.selectedTreeNodes.map(treeNode => treeNode.toResponse()),
            deselectedTreeNodes: this.deselectedTreeNodes.map(treeNode => treeNode.toResponse()),
            filters: this.filters.map(filter => filter.toResponse()),
        };
    }
}
interface WorkspaceCreateParams {
    name: string;
    slug: string;
    userId: string;
    email: string;
}

export async function createWorkspace({
    name,
    slug,
    userId,
}: WorkspaceCreateParams): Promise<Workspace> {
    const isSlugAvailable = (await WorkspaceModel.findBySlug(slug)) === null;

    if (!isSlugAvailable) {
        throw new WorkspaceSlugNotAvailable();
    }

    const workspaceId = new MongooseTypes.ObjectId();

    const workspaceDoc = new WorkspaceModel({
        _id: workspaceId,
        name,
        slug,
        projects: [],
        members: [{
            user: userId,
            joinedAt: new Date(),
        }],
        tags: [],
        createdBy: userId,
    });

    await workspaceDoc.save();

    return Workspace.fromDoc(workspaceDoc);
}

export async function addMember(workspaceId: string, userId: string) {
    const workspaceDoc = await WorkspaceModel.findById(workspaceId) as WorkspaceDoc;
    if (!workspaceDoc) {
        throw new WorkspaceNotFound({ workspace: workspaceId });
    }

    const user = await findUserById(userId);
    if (!user) {
        throw new NewMemberNotFound({ workspace: workspaceId, userId });
    }

    const isMember = workspaceDoc.members.find(member => member.user.equals(user.id));
    if (isMember) {
        return;
    }

    await WorkspaceJoinRequestModel.deleteMany({
        workspace: workspaceId,
        email: user.email,
    });

    await WorkspaceModel.insertMember(workspaceDoc._id, userId);
}

async function findOrCreateWorkspaceInvite(workspaceId: string, email: string, referrer: User): Promise<WorkspaceInvite> {
    const existingInvite = await WorkspaceInviteModel.findOne({
        email,
        workspace: workspaceId,
        isUsed: false,
        expiresAt: { $gt: new Date() },
    }).lean().exec();

    if (existingInvite) {
        throw new UserAlreadyInvited({ email });
    }

    const invite = new WorkspaceInviteModel({
        workspace: workspaceId,
        email,
        referrer: referrer.id,
        code: generateInviteCode(),
        expiresAt: Date.now() + config.INVITE_LIFETIME_MSEC,
    });

    await invite.save();
    return WorkspaceInvite.fromDoc(invite);
}

export async function inviteMember(workspaceId: string, email: string, referrer: User): Promise<WorkspaceInvite | User> {
    const workspace = await findWorkspaceById(workspaceId);
    const user = await findUserByEmail(email);

    if (!user) {
        return findOrCreateWorkspaceInvite(workspace.id, email, referrer);
    }

    const isMember = workspace.isUserMember(user.id);

    if (isMember) {
        throw new UserAlreadyMember({ workspace: workspace.slug, userId: user.id, email });
    }

    await addMember(workspace.id, user.id);

    return user;
}

export async function findWorkspaceInviteByCode(code: string): Promise<WorkspaceInvite | null> {
    const doc = await WorkspaceInviteModel.findOne({
        code,
    });

    if (!doc) {
        return null;
    }

    return WorkspaceInvite.fromDoc(doc);
}

export async function findWorkspaceInvitesByEmail(email: string): Promise<WorkspaceInvite[] | null> {
    const docs = await WorkspaceInviteModel.find({
        email,
    });

    if (docs.length === 0) {
        return null;
    }

    return docs.map(doc => WorkspaceInvite.fromDoc(doc));
}

export function getInviteUrl(): string {
    return `${config.APP_BASE_URL}/login`;
}

export function markInviteAsUsed(code: string, userId: string) {
    return WorkspaceInviteModel.updateOne({
        code,
    }, {
        $set: {
            isUsed: true,
            user: userId,
        },
    }).exec();
}

async function createWorkspaceInviteLink(workspaceId: string): Promise<WorkspaceInviteLink> {
    const inviteLinkDoc = new WorkspaceInviteLinkModel({
        workspace: workspaceId,
        code: generateInviteCode(),
    });

    await inviteLinkDoc.save();

    return WorkspaceInviteLink.fromDoc(inviteLinkDoc);
}

export async function findWorkspaceInviteLink(workspaceId: string, code: string): Promise<WorkspaceInviteLink> {
    const inviteLinkDoc = await WorkspaceInviteLinkModel.findOne({
        workspace: workspaceId,
        code,
    }).exec();

    if (!inviteLinkDoc) {
        throw new WorkspaceInviteLinkNotFound({ workspace: workspaceId, code });
    }

    if (inviteLinkDoc.isActive === false) {
        throw new WorkspaceInviteLinkNotActive({ workspace: workspaceId, code });
    }

    return WorkspaceInviteLink.fromDoc(inviteLinkDoc);
}

export async function findOrCreateWorkspaceInviteLink(workspaceId: string): Promise<WorkspaceInviteLink> {
    const inviteLinkDoc = await WorkspaceInviteLinkModel.findOne({ workspace: workspaceId, isActive: true }).exec();

    if (!inviteLinkDoc) {
        return createWorkspaceInviteLink(workspaceId);
    }

    return WorkspaceInviteLink.fromDoc(inviteLinkDoc);
}

export async function addMemberUsingInviteLink(workspaceId: string, code: string, userId: string): Promise<void> {
    await addMember(workspaceId, userId);

    await WorkspaceInviteLinkModel.updateOne({
        workspace: workspaceId,
        code,
    }, {
        $inc: {
            numberUsed: 1,
        },
    });

    const usage = new WorkspaceInviteLinkUsageModel({
        code,
        workspace: workspaceId,
        user: userId,
    });

    await usage.save();
}

export async function resetWorkspaceInviteLink(workspaceId: string, code: string): Promise<WorkspaceInviteLink> {
    await WorkspaceInviteLinkModel.updateOne({
        workspace: workspaceId,
        code,
        isActive: true,
    }, {
        $set: {
            isActive: false,
        },
    });

    return createWorkspaceInviteLink(workspaceId);
}

export async function getWorkspaceJoinRequests(workspaceId: string): Promise<WorkspaceJoinRequest[]> {
    const workspaceJoinRequestDocs = await WorkspaceJoinRequestModel.find({
        workspace: workspaceId,
    }).exec();

    return workspaceJoinRequestDocs.map(workspaceJoinRequestDoc => WorkspaceJoinRequest.fromDoc(workspaceJoinRequestDoc));
}

export async function createWorkspaceJoinRequest(workspaceId: string, email: string): Promise<WorkspaceJoinRequest> {
    const workspaceJoinRequestDoc = await WorkspaceJoinRequestModel.findOne({
        workspace: workspaceId,
        email,
    }).exec();

    if (workspaceJoinRequestDoc) {
        throw new WorkspaceJoinRequestAlreadyExists({ workspace: workspaceId, email });
    }

    const workspace = await findWorkspaceById(workspaceId);
    const user = await findUserByEmail(email);
    const isMember = user && workspace.isUserMember(user.id);

    if (isMember) {
        throw new UserAlreadyMember({ workspace: workspace.slug, userId: user.id, email: user.email });
    }

    const newWorkspaceJoinRequestDoc = new WorkspaceJoinRequestModel({
        workspace: workspaceId,
        email,
    });

    await newWorkspaceJoinRequestDoc.save();

    return WorkspaceJoinRequest.fromDoc(newWorkspaceJoinRequestDoc);
}

export async function acceptWorkspaceJoinRequest(workspaceJoinRequestId: string, referrer: User): Promise<WorkspaceInvite | User> {
    const workspaceJoinRequestDoc = await WorkspaceJoinRequestModel.findById(workspaceJoinRequestId).exec();

    if (!workspaceJoinRequestDoc) {
        throw new WorkspaceJoinRequestNotFound({ workspaceJoinRequest: workspaceJoinRequestId });
    }

    const workspaceJoinRequest = WorkspaceJoinRequest.fromDoc(workspaceJoinRequestDoc);

    await WorkspaceJoinRequestModel.findByIdAndDelete(workspaceJoinRequestId);

    return await inviteMember(workspaceJoinRequest.workspace, workspaceJoinRequest.email, referrer);
}

export async function denyWorkspaceJoinRequest(workspaceJoinRequestId: string): Promise<void> {
    await WorkspaceJoinRequestModel.findByIdAndDelete(workspaceJoinRequestId);
}

export async function findWorkspaceById(id: string) {
    const workspaceDoc = await WorkspaceModel.findById(id);
    if (!workspaceDoc) {
        throw new WorkspaceNotFound({ workspace: id });
    }

    return Workspace.fromDoc(workspaceDoc);
}

export async function findWorkspaceBySlug(slug: string) {
    const workspaceDoc = await WorkspaceModel.findBySlug(slug);
    if (!workspaceDoc) {
        throw new WorkspaceNotFound({ workspace: slug });
    }

    return Workspace.fromDoc(workspaceDoc);
}

export async function getWorkspaceSlug(workspaceId: string) {
    const slug = await WorkspaceModel.findSlug(new MongooseTypes.ObjectId(workspaceId));

    if (!slug) {
        throw new WorkspaceNotFound({ workspace: workspaceId });
    }

    return slug;
}

const RESERVED_WORKSPACE_SLUGS = ["default", "slug"];
const WORKSPACE_SLUG_SUFFIX_LENGTH = 5;

export async function getWorkspaceSlugSuggestion(name: string): Promise<string> {
    const slug = generateSlug(name);
    const slugs = await WorkspaceModel.findSlugsStartingWith(slug);
    const slugsInUse = new Set([...RESERVED_WORKSPACE_SLUGS, ...slugs]);

    let suggestedSlug = slug;

    while (slugsInUse.has(suggestedSlug)) {
        const differentiator = generateNanoId(WORKSPACE_SLUG_SUFFIX_LENGTH);
        suggestedSlug = `${slug}-${differentiator}`;
    }

    return suggestedSlug;
}

interface AuthenticationData {
    auth?: AuthData;
    publicAuth?: PublicAuthData;
}

enum AccessLevel {
    Full = "full",
    Page = "page",
    ReadOnly = "readOnly",
}

export async function getWorkspaceIfAuthorized(
    slug: string,
    permission: UserPermission,
    { auth, publicAuth }: AuthenticationData
): Promise<Workspace> {
    try {
        const workspace = await findWorkspaceBySlug(slug);
        const isMember = auth && workspace.isUserMember(auth.userId);
        const isAuthorized = isMember ||
            (permission === UserPermission.READ && (workspace.isPublic || auth?.isAdmin || publicAuth?.workspace === workspace.id));

        if (!isAuthorized) {
            if (auth) {
                throw new MemberNotFound({ workspace: slug, userId: auth.userId });
            } else {
                throw new UserNotAuthorized();
            }
        }

        return workspace;
    } catch (error) {
        if (!auth && error instanceof WorkspaceNotFound) {
            throw new UserNotAuthorized();
        }
        throw error;
    }
}

export async function findUserWorkspaces(userId: string): Promise<Workspace[]> {
    const workspaces = await WorkspaceModel.find({
        "members.user": userId,
    }).exec();

    return workspaces.map(workspace => Workspace.fromDoc(workspace));
}

export async function findDefaultWorkspace(userId: string): Promise<Workspace> {
    const workspaces = await WorkspaceModel.find({
        "members.user": userId,
    }, {
        "members": {
            $elemMatch: { user: userId },
        },
    });

    if (workspaces.length === 0) {
        throw new UserNotHaveWorkspace({ userId });
    }

    workspaces.sort((w1, w2) => w1.members[0].joinedAt.getTime() - w2.members[0].joinedAt.getTime());

    const defaultWorkspace = await WorkspaceModel.findById(workspaces[0].id);
    if (!defaultWorkspace) {
        throw new UserNotHaveWorkspace({ userId });
    }

    return Workspace.fromDoc(defaultWorkspace);
}

export async function getPendingInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
    const inviteDocs: WorkspaceInviteDoc[] = await WorkspaceInviteModel.find({
        workspace: workspaceId,
        isUsed: false,
    });

    return inviteDocs.map(inviteDoc => WorkspaceInvite.fromDoc(inviteDoc));
}

export async function removePendingInvite(workspaceId: string, inviteId: string): Promise<void> {
    await WorkspaceInviteModel.deleteOne({
        _id: inviteId,
        workspace: workspaceId,
    });
}

export async function getMembers(workspace: Workspace): Promise<Member[]> {
    const userIds = workspace.members.map(member => member.user);

    const users = await getMultipleUsers(userIds);
    const userMap = Object.fromEntries(users.map(user => [user.id, user]));

    return workspace.members.map(member => new Member(userMap[member.user]));
}

export async function removeMember(workspaceId: string, userId: string): Promise<void> {
    await WorkspaceModel.updateOne({
        _id: workspaceId,
    }, {
        $pull: {
            members: { user: userId },
        },
    });
}

const RESERVED_TAG_SLUGS = ["core"];
const TAG_SLUG_SUFFIX_LENGTH = 2;

function generateUniqueTagSlug(workspace: Workspace, name: string): string {
    let slug = generateSlug(name);
    const slugs = new Set([...RESERVED_TAG_SLUGS, ...workspace.tags.map(tag => tag.slug)]);

    while (slugs.has(slug)) {
        const suffix = generateNanoId(TAG_SLUG_SUFFIX_LENGTH);
        slug = `${slug}-${suffix}`;
    }

    return slug;
}

async function updateAndRecalculateTags(workspace: Workspace) {
    await withAnalysisWriteLock(workspace.id, async () => {
        const latestAnalysisId = await getLatestIndexAnalysisId(workspace.id);
        if (latestAnalysisId) {
            const tags = workspace.getTags();
            await updateComponentTagsInAnalysis(latestAnalysisId, tags);
            await recalculateTags(workspace.id, latestAnalysisId);
        }
    });
}

async function upsertTag(workspaceId: string, tag: ComponentTag): Promise<Workspace> {
    const workspace = Workspace.fromDoc((await WorkspaceModel.findByIdAndUpdate(
        workspaceId,
        [{
            $set: {
                tags: {
                    $cond: {
                        if: { $in: [tag.slug, "$tags.slug"] },
                        then: {
                            $map: {
                                input: "$tags",
                                in: {
                                    $cond: {
                                        if: { $eq: ["$$this.slug", tag.slug] },
                                        then: {
                                            ...tag.toDoc(),
                                            createdAt: "$$this.createdAt",
                                        },
                                        else: "$$this",
                                    },
                                },
                            },
                        },
                        else: {
                            $concatArrays: ["$tags", [tag.toDoc()]],
                        },
                    },
                },
            },
        }],
        { new: true }
    ).exec())!);
    await updateAndRecalculateTags(workspace);
    return workspace;
}

export async function updateCoreTag(workspaceId: string, name: string, selectedTreeNodes: TreeNodeDoc[], deselectedTreeNodes: TreeNodeDoc[]): Promise<void> {
    const now = new Date();
    const tag = new ComponentTag({
        ...RESERVED_TAGS.CORE,
        name,
        createdAt: now,
        updatedAt: now,
        searchTerm: "",
        selectedTreeNodes: selectedTreeNodes.map(treeNode => new TreeNode(treeNode)),
        deselectedTreeNodes: deselectedTreeNodes.map(treeNode => new TreeNode(treeNode)),
        filters: [],
    });

    await upsertTag(workspaceId, tag);
}

export interface CreateTagParams {
    name: string;
    searchTerm?: string;
    selectedTreeNodes?: TreeNodeDoc[];
    deselectedTreeNodes?: TreeNodeDoc[];
    filters?: ComponentTagFilterDoc[];
}

export async function createTag(workspace: Workspace, {
    name,
    searchTerm = "",
    selectedTreeNodes = [],
    deselectedTreeNodes = [],
    filters = [],
}: CreateTagParams): Promise<Workspace> {
    const now = new Date();
    const colorMap = getColorMap(USER_DEFINED_TAG_COLORS, workspace.tags.map(({ color }) => color));
    const tag = new ComponentTag({
        name,
        slug: generateUniqueTagSlug(workspace, name),
        color: getNextColor(colorMap),
        createdAt: now,
        updatedAt: now,
        searchTerm,
        selectedTreeNodes: selectedTreeNodes.map(treeNode => new TreeNode(treeNode)),
        deselectedTreeNodes: deselectedTreeNodes.map(treeNode => new TreeNode(treeNode)),
        filters: filters.map(filter => new ComponentTagFilter(filter)),
    });

    return upsertTag(workspace.id, tag);
}

export interface UpdateTagParams {
    name?: string;
    searchTerm?: string;
    selectedTreeNodes?: TreeNodeDoc[];
    deselectedTreeNodes?: TreeNodeDoc[];
    filters?: ComponentTagFilterDoc[];
}

export async function updateTag(workspace: Workspace, slug: string, {
    name,
    searchTerm,
    selectedTreeNodes,
    deselectedTreeNodes,
    filters,
}: UpdateTagParams): Promise<Workspace> {
    const tag = workspace.tags.find(tag => tag.slug === slug);

    if (!tag) {
        throw new TagNotFound({ workspace: workspace.id, tag: slug });
    }

    const updatedTag = new ComponentTag(tag);

    if (name !== undefined) {
        updatedTag.name = name;
    }

    if (searchTerm !== undefined) {
        updatedTag.searchTerm = searchTerm;
    }

    if (selectedTreeNodes !== undefined && deselectedTreeNodes !== undefined) {
        updatedTag.selectedTreeNodes = selectedTreeNodes.map(treeNode => TreeNode.fromDoc(treeNode));
        updatedTag.deselectedTreeNodes = deselectedTreeNodes.map(treeNode => TreeNode.fromDoc(treeNode));
    }

    if (filters !== undefined) {
        updatedTag.filters = filters.map(filter => new ComponentTagFilter(filter));
    }

    return upsertTag(workspace.id, updatedTag);
}

export async function updateProjectName(workspace: Workspace, projectName: string, alias: string): Promise<Workspace> {
    const project = workspace.projects.find(project => project.name === projectName);

    if (!project) {
        throw new ProjectNotFound({ workspace: workspace.id, projectName });
    }

    if (!project.isInternal) {
        throw new ProjectNotInternal({ workspace: workspace.id, projectName });
    }

    const aliases = workspace.projects.map(project => project.alias ?? project.packageName);
    if (aliases.includes(alias)) {
        throw new ProjectAliasAlreadyExists({ workspace: workspace.id, alias });
    }

    const updateOperation = projectName === alias
        ? { $unset: { "projects.$[project].alias": "" } }
        : { $set: { "projects.$[project].alias": alias } };

    return Workspace.fromDoc((await WorkspaceModel.findByIdAndUpdate(
        workspace.id,
        updateOperation,
        {
            arrayFilters: [{ "project.name": projectName }],
            new: true,
        }
    ).exec())!);
}

export async function updateHtmlElementMap(workspace: Workspace, htmlElementMap: Record<string, string>): Promise<Workspace> {
    // Drop blank keys; keep blank values (a blank value suppresses a default suggestion).
    const sanitized: Record<string, string> = {};
    for (const [element, replacement] of Object.entries(htmlElementMap)) {
        const key = element.trim();
        if (key !== "") {
            sanitized[key] = replacement.trim();
        }
    }

    return Workspace.fromDoc((await WorkspaceModel.findByIdAndUpdate(
        workspace.id,
        { $set: { htmlElementMap: sanitized } },
        { new: true }
    ).exec())!);
}

export async function deleteTag(workspace: Workspace, slug: string) {
    const tag = workspace.tags.find(tag => tag.slug === slug);

    if (!tag) {
        throw new TagNotFound({ workspace: workspace.id, tag: slug });
    }

    const updatedWorkspace = Workspace.fromDoc((await WorkspaceModel.findByIdAndUpdate(
        workspace.id,
        {
            $pull: {
                tags: {
                    slug,
                },
            },
        },
        { new: true }
    ).exec())!);

    await updateAndRecalculateTags(updatedWorkspace);

    return workspace;
}

export async function resetTags(workspaceId: string): Promise<void> {
    await WorkspaceModel.updateOne(
        { _id: workspaceId },
        {
            $set: {
                tags: [],
            },
        }
    ).exec();
}

interface WorkspaceUpdateParams {
    numOfComponents: number;
}
export async function updateWorkspace(
    workspaceId: string,
    {
        numOfComponents,
    }: WorkspaceUpdateParams
): Promise<void> {
    await WorkspaceModel.updateOne(
        { _id: workspaceId },
        { $set: { numOfComponents } }
    );
}

interface ProjectCreateParams {
    name: string;
    packageName: string;
    isInternal: boolean;
    alias?: string;
    repository?: RepositorySubDoc;
}

export async function updateWorkspaceProjects(workspaceId: string, newProjects: ProjectCreateParams[]): Promise<void> {
    const existingWorkspace = await WorkspaceModel.findById(workspaceId).select("projects").lean().exec();

    if (!existingWorkspace) {
        throw new WorkspaceNotFound({ workspace: workspaceId });
    }

    const updatedProjects = newProjects.map(newProject => {
        const existingProject = existingWorkspace.projects.find(
            existing => existing.packageName === newProject.packageName
        );

        return {
            ...newProject,
            slug: generateSlug(newProject.packageName),
            alias: existingProject?.alias,
        };
    });

    await WorkspaceModel.updateOne(
        { _id: workspaceId },
        {
            $set: {
                projects: updatedProjects,
            },
        }
    ).exec();
}

export async function purgeWorkspaceData(slug: string, auth: AuthData) {
    const workspace = await getWorkspaceIfAuthorized(slug, UserPermission.WRITE, { auth });

    await Promise.all([
        purgeAnalysesForWorkspace(workspace.id),
        purgeAllComponentDataForWorkspace(workspace.id),
        purgeDataIssuesForWorkspace(workspace.id),
        WorkspaceModel.updateOne({ _id: workspace.id }, {
            $set: {
                projects: [],
                tags: [],
            },
        }),
    ]);
}

export async function getProjectCount(workspaceId: string) {
    const result = await WorkspaceModel.aggregate<{ projectCount: number; }>([
        {
            $match: { _id: new MongooseTypes.ObjectId(workspaceId) },
        },
        {
            $project: {
                projectCount: { $size: "$projects" },
            },
        },
    ]);

    if (!result || result.length === 0) {
        throw new WorkspaceNotFound({ workspace: workspaceId });
    }

    return result[0].projectCount;
}

export async function getTagCount(workspaceId: string) {
    const result = await WorkspaceModel.aggregate<{ tagCount: number; }>([
        {
            $match: { _id: new MongooseTypes.ObjectId(workspaceId) },
        },
        {
            $project: {
                tagCount: { $size: "$tags" },
            },
        },
    ]);

    if (!result || result.length === 0) {
        throw new WorkspaceNotFound({ workspace: workspaceId });
    }

    return result[0].tagCount;
}

export async function getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    const workspace = await WorkspaceModel.findById(workspaceId).select("projects").lean().exec();
    const projects = workspace?.projects ?? [];
    return projects.map(project => new Project(project));
}

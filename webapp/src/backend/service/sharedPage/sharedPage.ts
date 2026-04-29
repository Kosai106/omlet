import { generatePublicAuthToken } from "../auth/auth";
import { ServiceError } from "../error";
import { generateNanoId } from "../utils";

import { SharedPageModel, type SharedPageDoc } from "./models";

export class SharedPageNotFound extends ServiceError {
    constructor({ workspace, url, code }: { url: string; workspace?: string; code?: string; }) {
        super("Shared page not found", {
            details: {
                code,
                workspace,
                url,
            },
        });
    }
}

export class SharedPage {
    id: string;
    workspace: string;
    url: string;
    code: string;

    constructor(doc: SharedPageDoc) {
        this.id = doc._id.toHexString();
        this.workspace = doc.workspace.toHexString();
        this.url = doc.url;
        this.code = doc.code;
    }

    static fromDoc(doc: SharedPageDoc): SharedPage {
        return new SharedPage(doc);
    }

    toResponse() {
        return {
            id: this.id,
            workspace: this.workspace,
            url: this.url,
            code: this.code,
        };
    }
}

export async function findSharedPage(workspaceId: string, url: string): Promise<SharedPage> {
    const sharedPageDoc = await SharedPageModel.findOne({
        workspace: workspaceId,
        url,
    }).exec();

    if (!sharedPageDoc) {
        throw new SharedPageNotFound({ url, workspace: workspaceId });
    }

    return SharedPage.fromDoc(sharedPageDoc);
}

async function createSharedPage(workspaceId: string, url: string): Promise<SharedPage> {
    const sharedPageDoc = new SharedPageModel({
        workspace: workspaceId,
        url,
        code: generateNanoId(),
    });

    await sharedPageDoc.save();

    return SharedPage.fromDoc(sharedPageDoc);
}

export async function findOrCreateSharedPage(workspaceId: string, url: string): Promise<SharedPage> {
    try {
        return await findSharedPage(workspaceId, url);
    } catch {
        return await createSharedPage(workspaceId, url);
    }
}

export async function getSharedPagePublicAuthToken(url: string, code: string): Promise<string> {
    const sharedPageDoc = await SharedPageModel.findOne({
        url,
        code,
    }).exec();

    if (!sharedPageDoc) {
        throw new SharedPageNotFound({ url, code });
    }

    const sharedPage = SharedPage.fromDoc(sharedPageDoc);

    return generatePublicAuthToken(sharedPage.id, {
        url: sharedPage.url,
        workspace: sharedPage.workspace,
    });
}

export async function deleteSharedPage(workspaceId: string, url: string): Promise<void> {
    await SharedPageModel.deleteOne({
        workspace: workspaceId,
        url,
    }).exec();
}

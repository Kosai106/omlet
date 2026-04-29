import { WorkspaceModel } from "../../src/backend/service/workspace/models";

export async function createWorkspace({ _id, name, slug, userId }: {
    _id: string;
    name: string;
    slug: string;
    userId: string;
}): Promise<void> {
    const workspaceDoc = new WorkspaceModel({
        _id,
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
}

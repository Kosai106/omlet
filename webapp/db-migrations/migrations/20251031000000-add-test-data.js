const { ObjectId } = require("mongodb");

module.exports = {
    async up(db, client) {
        // Create test user
        const usersCollection = db.collection("users");
        const userResult = await usersCollection.insertOne({
            email: "test@example.com",
            fullName: "test user",
            createdAt: new Date()
        });

        const userId = userResult.insertedId;
        console.log(`Created test user with ID: ${userId}`);

        // Create test workspace
        const workspacesCollection = db.collection("workspaces");
        const workspaceResult = await workspacesCollection.insertOne({
            name: "test workspace",
            slug: "test-ws",
            projects: [],
            numOfComponents: 0,
            members: [
                {
                    user: userId,
                    joinedAt: new Date("2025-10-28T14:29:28.954+00:00")
                }
            ],
            tags: [],
            createdBy: userId,
            createdAt: new Date()
        });

        const workspaceId = workspaceResult.insertedId;
        console.log(`Created test workspace with ID: ${workspaceId}`);
    },

    async down(db, client) {
        // Remove test workspace
        const workspacesCollection = db.collection("workspaces");
        await workspacesCollection.deleteOne({ slug: "test-ws" });
        console.log("Removed test workspace");

        // Remove test user
        const usersCollection = db.collection("users");
        await usersCollection.deleteOne({ email: "test@example.com" });
        console.log("Removed test user");
    }
};
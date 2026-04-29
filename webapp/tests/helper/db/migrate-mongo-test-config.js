// This file is copied from ./db-migrations/migrate-mongo-config.js
// to set the indexes for the Mongo Test DB

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

const MONGO_URI = process.env.MONGODB_URI;

const config = {
    mongodb: {
        url: MONGO_URI,
    },

    // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
    migrationsDir: path.join(__dirname, "../../../db-migrations/migrations"),

    // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
    changelogCollectionName: "changelog",

    // The file extension to create migrations and search for in migration dir
    migrationFileExtension: ".js",

    // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
    // if the file should be run.  Requires that scripts are coded to be run multiple times.
    useFileHash: false,

    // Don't change this, unless you know what you're doing
    moduleSystem: "commonjs",
};

module.exports = config;

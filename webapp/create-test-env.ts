/* eslint-disable no-console */
import crypto from "crypto";
import fs from "fs";
import path from "path";

function generateRsaKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: "spki",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
        },
    });

    return {
        privateKey: Buffer.from(privateKey).toString("base64"),
        publicKey: Buffer.from(publicKey).toString("base64"),
    };
}

function createEnvFile() {
    const envPath = path.resolve(__dirname, ".env.test");

    if (fs.existsSync(envPath)) {
        console.log(".env.test file already exists. Skipping creation.");
        return;
    }

    try {
        const rsaKeys = generateRsaKeyPair();

        const envVars: Record<string, string> = {
            MODE: "test",
            NODE_ENV: "test",
            APP_ENV: "test",
            APP_BASE_URL: "http://localhost:3001",
            MW_PORT: "3001",
            JWT_PRIVATE_KEY_BASE64: rsaKeys.privateKey,
            JWT_PUBLIC_KEY_BASE64: rsaKeys.publicKey,
            MONGODB_URI: "mongodb://localhost:27017/omlet-api-test",
            MONGODB_DEBUG_ENABLED: "false",
            REDIS_URI: "redis://localhost:6379",
        };

        const envContent = Object.entries(envVars)
            .map(([key, value]) => `${key}="${value}"`)
            .join("\n");

        // Write the content to the .env file
        fs.writeFileSync(envPath, `${envContent}\n`);

        console.log(".env.test file created successfully.");
    } catch (error) {
        console.error("Error creating .env file:", error);
    }

    process.exit(0);
}

createEnvFile();

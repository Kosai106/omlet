import * as clr from "colorette";
import { promises as fs } from "fs";
import http from "http";
import inquirer from "inquirer";
import open from "open";
import os from "os";
import destroyer from "server-destroy";
import upath from "upath";
import url from "url";

import { type User, LoginRequiredError, RequestFailedError, getMe } from "./apiClient";
import { BASE_URL, ENV_TOKEN } from "./config";
import { createSpinner } from "./spinner";

const LOGIN_ENDPOINT = "/login";
const CLI_LOGIN_SUCCESS_ENDPOINT = "/login/cli-success";
const TOKEN_FILE_NAME = ".omletrc";
const JWT_REGEX = /^[\w-]+\.[\w-]+\.[\w-]+$/;

interface FsError extends Error {
    code?: string;
}

const TOKEN_FILE_PATH = upath.join(os.homedir(), TOKEN_FILE_NAME);
function writeTokenFile(tokens: Record<string, string>): Promise<void> {
    return fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokens));
}

async function readTokenFile(): Promise<Record<string, string>> {
    try {
        const content = await fs.readFile(TOKEN_FILE_PATH, "utf8");

        return JSON.parse(content) as Record<string, string>;
    } catch (e) {
        const code = (e as FsError).code;

        if (code === "ENOENT") {
            return {};
        }

        throw e;
    }
}

function getLoginURL(redirect: string): string {
    const loginUrl = new url.URL(LOGIN_ENDPOINT, BASE_URL);

    loginUrl.searchParams.append("redirect", redirect);
    loginUrl.searchParams.set("cli", "true");

    return loginUrl.toString();
}

function getSuccessURL(): string {
    return new url.URL(CLI_LOGIN_SUCCESS_ENDPOINT, BASE_URL).toString();
}

function fetchToken(port: number): Promise<string> {
    const loginURL = getLoginURL(`http://127.0.0.1:${port}/omlet-callback`);

    return new Promise((resolve, reject) => {
        console.log(clr.dim(`In case a new browser tab doesn't open, you can follow this link: ${loginURL}`));
        const spinner = createSpinner("Waiting for token…");
        spinner.start();

        function resolveToken(token: string) {
            server.destroy();
            spinner.succeed("Token acquired");
            resolve(token);
        }

        const server = http
            .createServer(async (request, response) => {
                if (!request.url) {
                    reject(new Error("Malformed request"));
                    return;
                }

                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Access-Control-Allow-Headers", "*");
                response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

                try {
                    if (request.method === "OPTIONS") {
                        response.writeHead(204);
                        response.end();

                        return;
                    } else if (request.method === "GET" && request.url.indexOf("/omlet-callback") > -1) {
                        const requestUrl = new url.URL(request.url, `http://${request.headers.host}`);
                        const token = requestUrl.searchParams.get("token");

                        if (token) {
                            response.setHeader("Location", getSuccessURL());
                            response.writeHead(302);
                            response.end();
                            resolveToken(token);
                            return;
                        }
                    }

                    response.writeHead(400);
                    response.end("Invalid request");
                } catch (e) {
                    reject(e);
                }
            })
            .listen(port, () => {
                open(loginURL, { wait: false }).then(cp => cp.unref());
            });
        destroyer(server);
    });
}

async function getTokenFromPrompt(): Promise<string> {
    const loginURL = getLoginURL(getSuccessURL());

    console.log(clr.dim(`In case a new browser tab doesn't open, you can follow this link: ${loginURL}`));
    const cp = await open(loginURL, { wait: false });
    cp.unref();

    const { token } = await inquirer.prompt<{ token: string; }>([{
        type: "text",
        message: "Paste your token here",
        prefix: "",
        name: "token",
        validate: (value: string) => (JWT_REGEX.test(value) ? true : "Invalid token"),
    }]);

    return token;
}

async function resetToken() {
    const tokens = await readTokenFile();
    if (tokens[BASE_URL]) {
        delete tokens[BASE_URL];

        await writeTokenFile(tokens);
    }
}

export class AuthenticationError extends Error {
    readonly reason: Error;

    constructor(reason: Error) {
        super("Authentication failed");
        this.name = this.constructor.name;
        this.reason = reason;
    }
}

export async function login(port: number, isRemote: boolean): Promise<string> {
    try {
        const tokens = await readTokenFile();
        const token = isRemote ? await getTokenFromPrompt() : await fetchToken(port);

        tokens[BASE_URL] = token;

        await writeTokenFile(tokens);

        const user = await getAuthenticatedUser();
        if (!user) {
            throw new AuthenticationError(new Error("User not found"));
        }

        return token;
    } catch (error) {
        throw new AuthenticationError(error as Error);
    }
}

export async function getToken() : Promise<string | undefined> {
    if (ENV_TOKEN) {
        return ENV_TOKEN;
    }

    const tokens = await readTokenFile();

    return tokens[BASE_URL];
}

export async function getAuthenticatedUser(): Promise<User | null> {
    const token = await getToken();

    if (token) {
        try {
            return await getMe();
        } catch (err) {
            const error = err as Error;
            const isAuthFailure = (
                error instanceof LoginRequiredError ||
                (error instanceof RequestFailedError && error.statusCode < 500 && error.statusCode > 300)
            );

            if (isAuthFailure) {
                await resetToken();
                return null;
            }

            throw error;
        }
    }

    return null;
}


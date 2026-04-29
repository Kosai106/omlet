import { exec as execWithCallback } from "child_process";
import gitRepoInfo from "git-repo-info";
import parseGitRepoUrl from "hosted-git-info";
import util from "util";

import { logError, logger } from "./logger";

const exec = util.promisify(execWithCallback);

export interface RepositoryInfo {
    scope?: string;
    name?: string;
    branch?: string;
    url?: string;
    initialCommitHash: string;
}

async function getRemoteOriginUrl(repoPath: string): Promise<string | undefined> {
    try {
        const cmd = "git config --get remote.origin.url";
        const { stdout } = await exec(cmd, { cwd: repoPath });
        return stdout.trim();
    } catch (err: unknown) {
        return;
    }
}

export async function getInitialCommitHash(repoRoot: string): Promise<string | undefined> {
    try {
        const { stdout } = await exec("git rev-list --max-parents=0 HEAD", { cwd: repoRoot });
        return stdout.trim();
    } catch (error) {
        logger.debug("Error while finding initial commit:");
        logError(error as Error);
        return;
    }
}

async function getCurrentBranch(repoPath: string): Promise<string | undefined> {
    try {
        const cmd = "git branch --show-current";
        const { stdout } = await exec(cmd, { cwd: repoPath });
        return stdout.trim();
    } catch (err: unknown) {
        return;
    }
}

export async function getRepoInfo(repoPath: string): Promise<RepositoryInfo | undefined> {
    const initialCommitHash = await getInitialCommitHash(repoPath);
    if (!initialCommitHash) {
        return;
    }

    const branch = await getCurrentBranch(repoPath);
    const url = await getRemoteOriginUrl(repoPath);

    if (!url) {
        return {
            initialCommitHash,
            branch,
        };
    }

    const info = parseGitRepoUrl.fromUrl(url);
    if (!info) {
        return {
            url,
            initialCommitHash,
            branch,
        };
    }

    return {
        scope: info.user,
        name: info.project,
        url: info.https({ noGitPlus: true }),
        branch,
        initialCommitHash,
    };
}

export function getGitRoot(path: string) {
    return gitRepoInfo(path).root;
}

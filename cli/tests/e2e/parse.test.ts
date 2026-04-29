import path from "upath";

import { runCli } from "./helper/cli";
import { getTempFolder } from "./helper/fs-utils";
import { runNpm } from "./helper/npm";
import { registryUrl } from "./helper/registry";

const SAMPLES_PATH = path.resolve(__dirname, "..", "..", "samples");

interface ParseResultFile {
    created_at: string | null;
    updated_at: string | null;
}

describe("`parse` command", () => {
    const workingDir = getTempFolder();

    beforeAll(async () => {
        await runNpm([
            "install",
            "@omlet/cli",
            "--prefix",
            workingDir,
            "--registry",
            registryUrl,
        ]);
    });

    it("should match the snapshot", async () => {
        const projectRoot = path.join(SAMPLES_PATH, "typescript");
        const globPattern = "**/simple/*.{ts,tsx}";

        const output = await runCli(
            path.join(workingDir, "node_modules", ".bin", "omlet"),
            ["parse", "-r", projectRoot, "-i", globPattern]
        );

        const outputJSON = JSON.parse(output) as ParseResultFile[];
        outputJSON.forEach(file => {
            file.created_at = null;
            file.updated_at = null;
        });

        expect(outputJSON).toMatchSnapshot();
    });
});

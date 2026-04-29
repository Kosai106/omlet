import path from "upath";

import { runCli } from "./helper/cli";
import { getTempFolder } from "./helper/fs-utils";
import { runNpm } from "./helper/npm";
import { registryUrl } from "./helper/registry";

const SAMPLES_PATH = path.resolve(__dirname, "..", "..", "samples");

describe("`alias-config` command", () => {
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
        const projectRoot = path.join(SAMPLES_PATH, "custom-alias");

        const output = await runCli(
            path.join(workingDir, "node_modules", ".bin", "omlet"),
            ["alias-config", "-r", projectRoot]
        );

        expect(JSON.parse(output)).toMatchSnapshot({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            absolutePath: expect.any(String),
        });
    });
});

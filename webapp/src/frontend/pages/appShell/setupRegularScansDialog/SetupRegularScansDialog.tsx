import { useState } from "react";

import { Callout, CalloutKind, CalloutSize } from "../../../library/Callout/Callout";
import { CodeSnippet } from "../../../library/CodeSnippet/CodeSnippet";
import { Dialog } from "../../../library/Dialog/Dialog";
import { H2, H3 } from "../../../library/Heading/Heading";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import classes from "./SetupRegularScansDialog.module.css";
import dialogClasses from "../../../library/Dialog/Dialog.module.css";

enum PackageManager {
    npm = "npm",
    yarn = "Yarn",
    pnpm = "pnpm",
}

const installSnippets = {
    [PackageManager.npm]: "npm i --save-dev @omlet/cli",
    [PackageManager.yarn]: "yarn add --dev @omlet/cli",
    [PackageManager.pnpm]: "pnpm add --save-dev @omlet/cli",
};

const loginSnippets = {
    [PackageManager.npm]: "npx omlet login --print-token",
    [PackageManager.yarn]: "yarn omlet login --print-token",
    [PackageManager.pnpm]: "pnpm exec omlet login --print-token",
};

const analyzeSnippets = {
    [PackageManager.npm]: "npx omlet analyze",
    [PackageManager.yarn]: "yarn omlet analyze",
    [PackageManager.pnpm]: "pnpm exec omlet analyze",
};

const GITHUB_ACTIONS_CODE =
`jobs:
  omlet_analyze:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          # Omlet uses git history for analysis; disable shallow clone
          fetch-depth: 0

      - name: Configure Node
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Analyze
        run: npx omlet analyze
        env:
          OMLET_TOKEN: \${{ secrets.OMLET_TOKEN }}`;

const CIRCLE_CI_CODE =
`jobs:
  omlet_analyze:
    executor: node/default
    steps:
      - checkout
      - node/install-packages
      - run:
          # Make sure the OMLET_TOKEN environment variable is set
          command: npx omlet analyze

workflows:
  omlet_analyze:
    jobs:
      - omlet_analyze`;

export function SetupRegularScansDialog() {
    const [selectedPackageManager, setSelectedPackageManager] = useState(PackageManager.npm);

    const {
        actions: {
            setIsSetupRegularScansDialogVisible,
        },
    } = useStore();

    function handleLanguageChange(packageManager: PackageManager) {
        setSelectedPackageManager(packageManager);
    }

    return (
        <Dialog onClose={() => setIsSetupRegularScansDialogVisible(false)}>
            <section>
                <H2 className={dialogClasses.h2}>Set up regular scans</H2>
                <p>
                    Automating your scans can help you capture how the adoption changes over time.
                    You can run Omlet using the following commands to submit new scans as your codebase gets updated.
                    <br/>
                    <br/>
                    Before you start, let’s make sure that Omlet is added as a development dependency.
                </p>
                <CodeSnippet.Tabbed code={installSnippets} language={selectedPackageManager} onLanguageChange={handleLanguageChange}/>
                <p>
                    Next up, you’ll need to provide the Omlet access token as an environment variable. Run the Omlet CLI tool locally to generate the token:
                </p>
                <CodeSnippet.Tabbed code={loginSnippets} language={selectedPackageManager} onLanguageChange={handleLanguageChange}/>
                <p>
                    Now set the printed access token to an environment variable named OMLET_TOKEN.
                </p>
            </section>
            <section>
                <H3 className={dialogClasses.h3}>CLI</H3>
                <p>
                    To scan your repos manually, or to add Omlet to your CI pipeline, you can use Omlet’s CLI tool.
                    See specific instructions below for GitHub Actions or CircleCI.
                </p>
                <CodeSnippet.Tabbed code={analyzeSnippets} language={selectedPackageManager} onLanguageChange={handleLanguageChange}/>
                <Callout kind={CalloutKind.Onboarding} size={CalloutSize.Large}>
                    <strong>Tip:</strong> Use the --ignore parameter to exclude files (test scripts, examples, stories, etc.) from scans,{" "}
                    <a
                        href="/l/docs/cli"
                        rel="nofollow external noopener noreferrer"
                        target="_blank">
                        learn more
                    </a>.
                </Callout>
            </section>
            <section>
                <H3 className={dialogClasses.h3}>GitHub Actions</H3>
                <p>
                    For each repo you want to automate, add the following job definition.
                </p>
                <CodeSnippet className={classes.codeSnippet} code={GITHUB_ACTIONS_CODE}/>
            </section>
            <section>
                <H3 className={dialogClasses.h3}>CircleCI</H3>
                <p>
                    For each repo you want to automate, add the following job and workflow definitions.
                </p>
                <CodeSnippet className={classes.codeSnippet} code={CIRCLE_CI_CODE}/>
            </section>
        </Dialog>
    );
}

import { useState } from "react";

import { Callout, CalloutKind } from "../../../library/Callout/Callout";
import { CodeSnippet } from "../../../library/CodeSnippet/CodeSnippet";
import { Dialog } from "../../../library/Dialog/Dialog";
import { H2, H3 } from "../../../library/Heading/Heading";
import { ImgScanMoreProjects } from "../../../library/icons/ImgScanMoreProjects";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import classes from "./ScanMoreProjectsDialog.module.css";
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

const analyzeSnippets = {
    [PackageManager.npm]: "npx omlet analyze",
    [PackageManager.yarn]: "yarn omlet analyze",
    [PackageManager.pnpm]: "pnpm exec omlet analyze",
};

export function ScanMoreProjectsDialog() {
    const [selectedPackageManager, setSelectedPackageManager] = useState(PackageManager.npm);

    const {
        actions: {
            setIsScanMoreProjectsDialogVisible,
        },
    } = useStore();

    function handleLanguageChange(packageManager: PackageManager) {
        setSelectedPackageManager(packageManager);
    }

    return (
        <Dialog
            className={classes.scanMoreProjectsDialog}
            onClose={() => setIsScanMoreProjectsDialogVisible(false)}>
            <section>
                <H2 className={dialogClasses.h2}>Scan more projects</H2>
                <p>
                    Omlet can provide more insights if you scan more projects,
                    like how your components are used across projects.
                </p>
            </section>
            <section className={classes.example}>
                <div className={classes.indicator}/>
                <div>
                    <H3 className={classes.h3}>An example:</H3>
                    <p>
                        How different teams across the company use the last version (v2) of our library?
                    </p>
                    <ImgScanMoreProjects className={classes.exampleChartImage}/>
                    <Callout emoji="💡" kind={CalloutKind.Onboarding}>
                        Oh, looks like snack-consumer-app is adopting well!
                    </Callout>
                </div>
            </section>
            <section>
                <H3 className={dialogClasses.h3}>Add Omlet as a dependency</H3>
                <CodeSnippet.Tabbed code={installSnippets} language={selectedPackageManager} onLanguageChange={handleLanguageChange}/>
            </section>
            <section>
                <H3 className={dialogClasses.h3}>Scan your projects using the following command</H3>
                <CodeSnippet.Tabbed code={analyzeSnippets} language={selectedPackageManager} onLanguageChange={handleLanguageChange}/>
            </section>
        </Dialog>
    );
}

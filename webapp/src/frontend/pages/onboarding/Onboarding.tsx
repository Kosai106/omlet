import { useEffect, useMemo, useState } from "react";

import { generatePath, useNavigate, useParams } from "react-router-dom";

import { hasCoreTag } from "../../../common/models/Tag";
import { RoutePath } from "../../../common/RoutePath";
import { compareProject } from "../../../common/sortUtils";
import {
    APIError,
    APIErrorCode,
    getLatestAnalysisFolders,
    getWorkspace as getWorkspaceBySlug,
} from "../../api/api";
import { Header } from "../../containers/header/Header";
import { MainHeaderButton } from "../../containers/header/mainHeaderButton/MainHeaderButton";
import { Loading } from "../../library/Loading/Loading";
import { logError } from "../../logger";
import { type Package } from "../../models/Package";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { combineFolders, createComponentNumberMap } from "../../treeUtils";

import { DEFAULT_CORE_TAG_NAME } from "./constants";
import { CoreFoldersStep } from "./coreFoldersStep/CoreFoldersStep";
import { CoreNameStep } from "./coreNameStep/CoreNameStep";
import { OnboardingContext } from "./OnboardingContext";
import { OtherTagsStep } from "./otherTagsStep/OtherTagsStep";

import classes from "./Onboarding.module.css";

enum OnboardingSteps {
    CoreName,
    CoreFolders,
    OtherTags,
}

export function Onboarding() {
    const { workspaceSlug } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(OnboardingSteps.CoreName);
    const [coreTagName, setCoreTagName] = useState<string | null>(null);

    const [packages, setPackages] = useState<Package[]>([]);
    const [totalNumberOfUsages, setTotalNumberOfUsages] = useState<number>(0);

    const componentNumberMap = useMemo(() => createComponentNumberMap(packages), [packages]);

    const totalNumberOfComponents = useMemo(() =>
        packages.reduce((acc, { totalNumberOfComponents }) => acc + totalNumberOfComponents, 0)
    , [componentNumberMap]);

    const {
        actions: { setWorkspace },
        selectors: { getWorkspace },
    } = useStore();

    const workspace = getWorkspace();

    function handleCoreNameTitleClick() {
        setCurrentStep(OnboardingSteps.CoreName);
    }

    function handleCoreNameChange(value: string) {
        setCoreTagName(value);
    }

    function handleCoreNameContinueClick() {
        if (coreTagName === null) {
            setCoreTagName(DEFAULT_CORE_TAG_NAME);
        }

        setCurrentStep(OnboardingSteps.CoreFolders);
    }

    function handleCoreFoldersTitleClick() {
        setCurrentStep(OnboardingSteps.CoreFolders);
    }

    async function handleCoreFoldersContinueClick() {
        setCurrentStep(OnboardingSteps.OtherTags);
    }

    useEffect(() => {
        async function fetchData() {
            if (!workspaceSlug) {
                return;
            }

            try {
                const [{ workspace, accessLevel }, folders] = await Promise.all([
                    getWorkspaceBySlug(workspaceSlug),
                    getLatestAnalysisFolders(workspaceSlug),
                ]);

                setWorkspace(workspace, accessLevel);

                if (hasCoreTag(workspace.tags)) {
                    navigate(generatePath(RoutePath.RepoHome, { workspaceSlug }), { replace: true });
                    return;
                }

                folders.packages.sort((a, b) => compareProject(
                    { name: a.name, isInternal: true },
                    { name: b.name, isInternal: true },
                ));

                const packages = folders.packages.map(pckg => ({
                    ...pckg,
                    children: pckg.children.map(folder => combineFolders(folder, pckg.name, workspace.tags)),
                }));

                setPackages(packages);
                setTotalNumberOfUsages(folders.totalNumberOfUsages);
            } catch (error) {
                if (error instanceof APIError && error.code === APIErrorCode.WORKSPACE_NOT_FOUND) {
                    navigate("/", { replace: true });
                }
                logError(error);
            }
        }

        fetchData();
    }, [workspaceSlug]);

    if (!workspaceSlug) {
        return null;
    }

    function renderMainContent() {
        if (!workspace || packages.length === 0) {
            return <Loading className={classes.loading}/>;
        }

        switch (currentStep) {
            case OnboardingSteps.CoreName: {
                return (
                    <CoreNameStep
                        coreTagName={coreTagName}
                        onChange={handleCoreNameChange}
                        onContinueClick={handleCoreNameContinueClick}/>
                );
            }
            case OnboardingSteps.CoreFolders: {
                return (
                    <CoreFoldersStep
                        workspaceSlug={workspace.slug}
                        coreTagName={coreTagName}
                        packages={packages}
                        tags={workspace.tags}
                        componentNumberMap={componentNumberMap}
                        onCoreNameTitleClick={handleCoreNameTitleClick}
                        onContinueClick={handleCoreFoldersContinueClick}/>
                );
            }
            case OnboardingSteps.OtherTags: {
                return (
                    <OtherTagsStep
                        workspaceSlug={workspace.slug}
                        coreTagName={coreTagName}
                        packages={packages}
                        onCoreNameTitleClick={handleCoreNameTitleClick}
                        onCoreFoldersTitleClick={handleCoreFoldersTitleClick}/>
                );
            }
        }
    }

    return (
        <>
            <Header
                leftContent={<MainHeaderButton showAllScans/>}
                hideRightContent/>
            <main className={classes.onboarding}>
                <OnboardingContext.Provider value={{
                    totalNumberOfComponents,
                    totalNumberOfUsages,
                }}>
                    {renderMainContent()}
                </OnboardingContext.Provider>
            </main>
        </>
    );
}

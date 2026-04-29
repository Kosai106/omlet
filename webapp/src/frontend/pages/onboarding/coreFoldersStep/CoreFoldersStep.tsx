import { useMemo, useState } from "react";

import { EMPTY_FOLDER_FILTER, isFolderFilterEmpty, type FolderFilter } from "../../../../common/models/FolderFilter";
import { type Tag, RESERVED_TAGS, createTag } from "../../../../common/models/Tag";
import { type TreeNode } from "../../../../common/models/TreeNode";
import { pluralize } from "../../../../common/utils";
import { setCoreTag } from "../../../api/api";
import { FolderTreeView } from "../../../common/FolderTreeView/FolderTreeView";
import { TreeContainer } from "../../../common/TreeContainer/TreeContainer";
import { TruncateFromMiddle } from "../../../common/truncate/TruncateFromMiddle";
import { Button } from "../../../library/Button/Button";
import { logError } from "../../../logger";
import { type Package } from "../../../models/Package";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { AnimatedArrow } from "../animatedArrow/AnimatedArrow";
import { DEFAULT_DESIGN_SYSTEM_NAME } from "../constants";
import { OnboardingStep } from "../onboardingStep/OnboardingStep";
import { OnboardingStepCard } from "../onboardingStepCard/OnboardingStepCard";

import classes from "./CoreFoldersStep.module.css";
import onboardingStepClasses from "../onboardingStep/OnboardingStep.module.css";

interface Props {
    workspaceSlug: string;
    coreTagName: string | null;
    packages: Package[];
    tags: Tag[];
    componentNumberMap: Record<string, number>;
    onCoreNameTitleClick(): void;
    onContinueClick(): void;
}

export function CoreFoldersStep({
    workspaceSlug,
    coreTagName,
    packages,
    tags,
    componentNumberMap,
    onCoreNameTitleClick,
    onContinueClick,
}: Props) {
    const [isSettingCoreTag, setIsSettingCoreTag] = useState(false);

    const { actions: { setTag } } = useStore();

    const coreTag = tags.find(({ slug }) => slug === RESERVED_TAGS.CORE.slug);
    const designSystemName = coreTagName?.trim() || DEFAULT_DESIGN_SYSTEM_NAME;

    const [folders, setFolders] = useState<FolderFilter>(() => {
        if (coreTag === undefined) {
            return EMPTY_FOLDER_FILTER;
        }

        const { selectedTreeNodes, deselectedTreeNodes } = coreTag;

        return { selectedTreeNodes, deselectedTreeNodes };
    });

    const numberOfCoreComponents = useMemo(() => {
        const { selectedTreeNodes, deselectedTreeNodes } = folders;

        const selectedNumber = selectedTreeNodes.reduce((sum, node) => sum + componentNumberMap[node.toString()], 0);
        const deselectedNumber = deselectedTreeNodes.reduce((sum, node) => sum + componentNumberMap[node.toString()], 0);

        return selectedNumber - deselectedNumber;
    }, [componentNumberMap, folders]);

    function handleSelectionChange(node: TreeNode, isSelected: boolean) {
        const { selectedTreeNodes, deselectedTreeNodes } = folders;

        const newSelectedFolders = selectedTreeNodes.filter(selectedNode => !selectedNode.startsWith(node));
        const newDeselectedFolders = deselectedTreeNodes.filter(deselectedNode => !deselectedNode.startsWith(node));

        if (isSelected && !deselectedTreeNodes.some(deselectedNode => deselectedNode.equals(node))) {
            newSelectedFolders.push(node);
        } else if (!isSelected && !selectedTreeNodes.some(selectedTreeNode => selectedTreeNode.equals(node))) {
            newDeselectedFolders.push(node);
        }

        setFolders({
            selectedTreeNodes: newSelectedFolders,
            deselectedTreeNodes: newDeselectedFolders,
        });
    }

    async function handleContinueClick() {
        try {
            setIsSettingCoreTag(true);

            await setCoreTag(workspaceSlug, designSystemName, folders);

            setTag(createTag({
                slug: RESERVED_TAGS.CORE.slug,
                color: RESERVED_TAGS.CORE.color,
                name: designSystemName,
                ...folders,
            }));

            setIsSettingCoreTag(false);
            onContinueClick();
        } catch (error) {
            logError(error);
            setIsSettingCoreTag(false);
        }
    }

    return (
        <OnboardingStep
            stepCards={
                <>
                    <OnboardingStepCard
                        title="What should we call your design system?"
                        onTitleClick={onCoreNameTitleClick}/>
                    <OnboardingStepCard
                        title={<>Where are your <TruncateFromMiddle text={designSystemName} width={150}/> components located?</>}
                        active>
                        <p>
                            Omlet tags your design system components as “{designSystemName}” to generate valuable usage insights. This tag will also help you easily identify these components as you’re doing various analysis.
                            <br/>
                            <br/>
                            <strong>From the list on the right, select which packages or folders contain {designSystemName} components.</strong>
                        </p>
                        <div>
                            <Button onClick={handleContinueClick} disabled={isFolderFilterEmpty(folders) || isSettingCoreTag}>Continue</Button>
                            <span className={classes.selectedCoreComponentCount}>
                                {
                                    numberOfCoreComponents === 0
                                        ? "No components selected yet"
                                        : `${pluralize("component", numberOfCoreComponents)} selected`
                                }
                            </span>
                        </div>
                        <AnimatedArrow className={classes.coreFoldersArrow}/>
                    </OnboardingStepCard>
                    <OnboardingStepCard title={<>Need to tag more components? <span className={onboardingStepClasses.headerSubText}>(Optional)</span></>}/>
                </>
            }
            stepContent={
                <TreeContainer
                    header={<>All scanned packages <span className={classes.headerSubText}>({packages.length})</span></>}>
                    <FolderTreeView
                        packages={packages}
                        folders={folders}
                        onSelectionChange={handleSelectionChange}/>
                </TreeContainer>
            }/>
    );
}

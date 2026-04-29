import { generatePath } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import { TreeContainer } from "../../../common/TreeContainer/TreeContainer";
import { TruncateFromMiddle } from "../../../common/truncate/TruncateFromMiddle";
import { TagManagementTree } from "../../../containers/tagManagementTree/TagManagementTree";
import { ButtonLink } from "../../../library/Button/Button";
import { type Package } from "../../../models/Package";
import { AnimatedArrow } from "../animatedArrow/AnimatedArrow";
import { DEFAULT_DESIGN_SYSTEM_NAME } from "../constants";
import { OnboardingStep } from "../onboardingStep/OnboardingStep";
import { OnboardingStepCard } from "../onboardingStepCard/OnboardingStepCard";

import classes from "./OtherTagsStep.module.css";
import onboardingStepClasses from "../onboardingStep/OnboardingStep.module.css";

interface Props {
    workspaceSlug: string;
    coreTagName: string | null;
    packages: Package[];
    onCoreNameTitleClick(): void;
    onCoreFoldersTitleClick(): void;
}

export function OtherTagsStep({
    workspaceSlug,
    coreTagName,
    packages,
    onCoreNameTitleClick,
    onCoreFoldersTitleClick,
}: Props) {
    const designSystemName = coreTagName?.trim() || DEFAULT_DESIGN_SYSTEM_NAME;

    return (
        <OnboardingStep
            stepCards={
                <>
                    <OnboardingStepCard
                        title="What should we call your design system?"
                        onTitleClick={onCoreNameTitleClick}/>
                    <OnboardingStepCard
                        title={<>Where are your <TruncateFromMiddle text={designSystemName} width={150}/> components located?</>}
                        onTitleClick={onCoreFoldersTitleClick}/>
                    <OnboardingStepCard
                        title={<>Need to tag more components? <span className={onboardingStepClasses.headerSubText}>(Optional)</span></>}
                        active>
                        <p>
                            You can use tags to identify other components as well. Common use cases are:
                        </p>
                        <ul>
                            <li>Compare usage of older design system versions: `v1`, `v2`, `legacy`</li>
                            <li>Track usage of components you hope to deprecate: `deprecated`</li>
                            <li>Analyze your design system component usage in more detail: `icons`, `atoms`, `templates`</li>
                        </ul>
                        <p>
                            <strong>From the list on the right, select packages or folders to assign tags to.</strong>
                        </p>
                        <p className={onboardingStepClasses.caption}>
                            You can always change these tags later from the “Components” tab.
                        </p>
                        <AnimatedArrow className={classes.otherTagsArrow}/>
                    </OnboardingStepCard>
                    <ButtonLink
                        className={classes.continueToDashboardButton}
                        to={generatePath(RoutePath.Dashboard, { workspaceSlug })}>
                        Continue to Dashboard
                    </ButtonLink>
                </>
            }
            stepContent={
                <TreeContainer
                    header={<>All scanned packages <span className={classes.headerSubText}>({packages.length})</span></>}>
                    <TagManagementTree packages={packages}/>
                </TreeContainer>
            }/>
    );
}

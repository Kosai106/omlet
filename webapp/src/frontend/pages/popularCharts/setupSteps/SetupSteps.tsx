import { Link } from "react-router-dom";

import { pluralize } from "../../../../common/utils";
import { Checkbox } from "../../../library/Checkbox/Checkbox";
import { H3 } from "../../../library/Heading/Heading";
import { IconCancelWithContainer } from "../../../library/icons/IconCancelWithContainer";
import { AccessLevel } from "../../../models/AccessLevel";
import { usePreferencesStore } from "../../../providers/PreferencesStoreProvider/PreferencesStoreProvider";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import classes from "./SetupSteps.module.css";

interface SimpleSetupStep {
    text: string;
    completed: boolean;
}

interface SetupStepWithURL extends SimpleSetupStep {
    url: string;
    internal?: boolean;
}

interface SetupStepWithOnClick extends SimpleSetupStep {
    onClick(): void;
}

type SetupStep = SetupStepWithURL | SetupStepWithOnClick;

interface Props {
    isRegularScansSetup: boolean;
    hasNonReservedTags: boolean;
}

export function SetupSteps({ isRegularScansSetup, hasNonReservedTags }: Props) {
    const {
        actions: {
            setIsSetupRegularScansDialogVisible,
            setIsScanMoreProjectsDialogVisible,
            setIsAddMoreTagsDialogVisible,
        },
        selectors: {
            getUser,
            getWorkspace,
            getAccessLevel,
        },
    } = useStore();
    const {
        actions: { hideSetupSteps },
        selectors: { getIsSetupStepsVisible },
    } = usePreferencesStore();

    const accessLevel = getAccessLevel();
    const workspace = getWorkspace()!;
    const isSetupStepsVisible = getIsSetupStepsVisible(workspace.id) && accessLevel === AccessLevel.Full;

    function handleCloseClick() {
        hideSetupSteps(getUser()!.id, workspace.id);
    }

    const setupSteps: SetupStep[] = [{
        text: "Ponder how you’ll measure your\ndesign system, then find Omlet",
        url: "https://omlet.dev",
        completed: true,
    }, {
        text: "Install CLI",
        url: "/l/docs/cli",
        completed: true,
    }, {
        text: "Scan codebase",
        url: "/l/docs/cli",
        completed: true,
    }, {
        text: "Tag design system components",
        url: "/l/docs/cli/core-tag",
        completed: true,
    }, {
        text: "Set up regular scans",
        onClick() {
            setIsSetupRegularScansDialogVisible(true);
        },
        completed: isRegularScansSetup,
    }, {
        text: "Scan more projects",
        onClick() {
            setIsScanMoreProjectsDialogVisible(true);
        },
        completed: workspace.projects.length > 1,
    }, {
        text: "Add more tags",
        onClick() {
            setIsAddMoreTagsDialogVisible(true);
        },
        completed: hasNonReservedTags,
    }];

    const completedSteps = setupSteps.filter(({ completed }) => completed);
    const incompleteSteps = setupSteps.filter(({ completed }) => !completed);

    function renderStepContent(step: SetupStep) {
        const { text } = step;

        if ("url" in step) {
            if (step.internal) {
                return <Link to={step.url} state={{ fromApp: true }}>{text}</Link>;
            }

            return (
                <a
                    href={step.url}
                    rel="nofollow external noopener noreferrer"
                    target="_blank">
                    {text}
                </a>
            );
        }

        return (
            <button onClick={() => step.onClick()}>
                {text}
            </button>
        );
    }

    const title = incompleteSteps.length === 0
        ? "All steps completed!"
        : `${pluralize("step", incompleteSteps.length)} to complete setup`;

    if (!isSetupStepsVisible) {
        return null;
    }

    return (
        <div className={classes.setupSteps}>
            {accessLevel === AccessLevel.Full && incompleteSteps.length === 0 && (
                <button className={classes.closeButton} onClick={handleCloseClick}>
                    <IconCancelWithContainer/>
                </button>
            )}
            <H3 className={classes.title}>{title}</H3>
            <ul>
                {completedSteps.map(step => (
                    <li key={step.text} className={classes.completedStep}>
                        <Checkbox.Solid className={classes.checkbox} color="var(--accent-green)" value={0} checked readOnly/>
                        <s>{renderStepContent(step)}</s>
                    </li>
                ))}
                {incompleteSteps.map(step => (
                    <li key={step.text} className={classes.incompleteStep}>
                        {renderStepContent(step)}
                    </li>
                ))}
            </ul>
        </div>
    );
}

import { useMemo, useState, useRef, useEffect, type UIEvent } from "react";

import classNames from "classnames";

import { updateProjectName } from "../../../api/api";
import { Dialog } from "../../../library/Dialog/Dialog";
import { H2 } from "../../../library/Heading/Heading";
import { logError } from "../../../logger";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import { ProjectDialogCell } from "./ProjectDialogCell/ProjectDialogCell";

import classes from "./RenameProjectsDialog.module.css";

export function RenameProjectsDialog() {
    const projectsRef = useRef<HTMLDivElement>(null);
    const [isTopShadowVisible, setIsTopShadowVisible] = useState(false);
    const [isBottomShadowVisible, setIsBottomShadowVisible] = useState(false);

    const {
        actions: {
            closeRenameProjectsDialog,
            setWorkspace,
        },
        selectors: {
            getWorkspace,
        },
    } = useStore();

    const workspace = getWorkspace()!;
    const internalProjects = useMemo(() => workspace.projects.filter(project => project.isInternal), [workspace.projects]);
    const aliases = useMemo(() => internalProjects.map(project => project.alias ?? project.packageName), [internalProjects]);

    useEffect(() => {
        if (
            projectsRef.current !== null &&
            projectsRef.current.scrollTop + projectsRef.current.clientHeight < projectsRef.current.scrollHeight
        ) {
            setIsBottomShadowVisible(true);
        }
    }, [projectsRef.current]);

    function handleScroll(event: UIEvent<HTMLDivElement>) {
        if (event.currentTarget.scrollTop > 0 && !isTopShadowVisible) {
            setIsTopShadowVisible(true);
        } else if (event.currentTarget.scrollTop === 0 && isTopShadowVisible) {
            setIsTopShadowVisible(false);
        }

        const scrollBottom = event.currentTarget.scrollTop + event.currentTarget.clientHeight;
        if (scrollBottom >= event.currentTarget.scrollHeight && isBottomShadowVisible) {
            setIsBottomShadowVisible(false);
        } else if (scrollBottom < event.currentTarget.scrollHeight && !isBottomShadowVisible) {
            setIsBottomShadowVisible(true);
        }
    }

    async function handleInputChange(projectName: string, alias: string) {
        try {
            const encodedProjectName = encodeURIComponent(projectName);
            const {
                workspace: updatedWorkspace,
                accessLevel,
            } = await updateProjectName(workspace.slug, encodedProjectName, alias);

            setWorkspace(updatedWorkspace, accessLevel);
        } catch (error) {
            logError(error);
        }
    }

    return (
        <Dialog
            className={classes.renameProjectsDialog}
            bodyClassName={classes.renameProjectsDialogBody}
            onClose={closeRenameProjectsDialog}>
            <div className={classes.content}>
                <div>
                    <H2 className={classes.header}>Rename projects</H2>
                    <p className={classes.description}>
                        Omlet lists projects based on package names by default. If you prefer a more accessible name,
                        you can rename them below.
                    </p>
                </div>
                <div ref={projectsRef} className={classes.projects} onScroll={handleScroll}>
                    {isTopShadowVisible && <div className={classNames(classes.scrollShadow, classes.top)}/>}
                    {internalProjects.map((project) => (
                        <ProjectDialogCell key={project.packageName} project={project} aliases={aliases} onChange={handleInputChange}/>
                    ))}
                    {isBottomShadowVisible && <div className={classNames(classes.scrollShadow, classes.bottom)}/>}
                </div>
            </div>
        </Dialog>
    );
}

import { generatePath } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import addMoreTagsURL from "../../../assets/img/imgAddMoreTags.png";
import addMoreTags2xURL from "../../../assets/img/imgAddMoreTags@2x.png";
import addMoreTags3xURL from "../../../assets/img/imgAddMoreTags@3x.png";
import { ButtonAnchor, ButtonKind, ButtonLink } from "../../../library/Button/Button";
import { Callout } from "../../../library/Callout/Callout";
import { Dialog } from "../../../library/Dialog/Dialog";
import { H2, H3 } from "../../../library/Heading/Heading";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import classes from "./AddMoreTagsDialog.module.css";

export function AddMoreTagsDialog() {
    const {
        selectors: {
            getWorkspace,
        },
        actions: {
            setIsAddMoreTagsDialogVisible,
        },
    } = useStore();

    const workspaceSlug = getWorkspace()!.slug;

    function hideAddMoreTagsDialog() {
        setIsAddMoreTagsDialogVisible(false);
    }

    return (
        <Dialog
            className={classes.addMoreTagsDialog}
            onClose={hideAddMoreTagsDialog}>
            <div className={classes.content}>
                <div className={classes.header}>
                    <H2 className={classes.h2}>
                        Add more tags
                    </H2>
                    <p className={classes.p}>
                        Tags help you generate usage insights for a subset of your components.
                        You can add additional tags to generate in-depth analysis from charts.
                        Here are some use cases that you might want to create tags in Omlet for:
                    </p>
                </div>
                <Callout>
                    <ul className={classes.useCaseList}>
                        <li>Deprecated components to track if their usage decreases</li>
                        <li>A complete legacy library that you're going to deprecate</li>
                        <li>Multiple design system libraries that you want to track individually</li>
                        <li>Categorizing projects or certain directories by teams</li>
                    </ul>
                </Callout>
                <div className={classes.example}>
                    <div className={classes.indicator}/>
                    <div className={classes.exampleContent}>
                        <H3>An example: Legacy component usage over time</H3>
                        <p className={classes.p}>How is our team doing while we’re migrating from our legacy library?</p>
                        <img
                            src={addMoreTagsURL}
                            srcSet={`${addMoreTags2xURL} 2x, ${addMoreTags3xURL} 3x`}
                            alt="Legacy library vs. design system usage over time chart"/>
                    </div>
                </div>
                <div className={classes.footer}>
                    <p className={classes.p}>
                        You can create tags from the Components page using the filters.
                    </p>
                    <div className={classes.buttons}>
                        <ButtonLink
                            to={generatePath(RoutePath.Components, { workspaceSlug })}
                            onClick={hideAddMoreTagsDialog}>
                            Go to Components page
                        </ButtonLink>
                        <ButtonAnchor
                            kind={ButtonKind.Secondary}
                            href="/l/docs/tag-components"
                            target="_blank">
                            I need help
                        </ButtonAnchor>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

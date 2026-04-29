
import { matchPath, useLocation } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import analyticsCustomPropertiesURL from "../../../assets/img/imgAnalyticsCustomProperties.png";
import analyticsCustomProperties2xURL from "../../../assets/img/imgAnalyticsCustomProperties@2x.png";
import analyticsCustomProperties3xURL from "../../../assets/img/imgAnalyticsCustomProperties@3x.png";
import componentsCustomPropertiesURL from "../../../assets/img/imgComponentsCustomProperties.png";
import componentsCustomProperties2xURL from "../../../assets/img/imgComponentsCustomProperties@2x.png";
import componentsCustomProperties3xURL from "../../../assets/img/imgComponentsCustomProperties@3x.png";
import { ButtonAnchor } from "../../../library/Button/Button";
import { Dialog } from "../../../library/Dialog/Dialog";
import { H2 } from "../../../library/Heading/Heading";
import { IconMetadata } from "../../../library/icons/IconMetadata";

import classes from "./CustomPropertiesDialog.module.css";

interface Props {
    onClose(): void;
}

export function CustomPropertiesDialog({ onClose }: Props) {
    const location = useLocation();

    const [customPropertiesURL, customProperties2xURL, customProperties3xURL] = matchPath(RoutePath.Components, location.pathname) !== null
        ? [componentsCustomPropertiesURL, componentsCustomProperties2xURL, componentsCustomProperties3xURL]
        : [analyticsCustomPropertiesURL, analyticsCustomProperties2xURL, analyticsCustomProperties3xURL];

    return (
        <Dialog
            className={classes.customPropertiesDialog}
            onClose={onClose}>
            <div className={classes.content}>
                <div className={classes.header}>
                    <IconMetadata/>
                    <H2 className={classes.h2}>
                        Custom properties
                    </H2>
                    <p className={classes.p}>
                        In addition to Omlet’s built-in properties, you can assign custom properties to your components
                        using Omlet’s CLI hooks. These custom properties can then be used to filter, tag and analyze components,
                        giving you more control over how to measure your design system.
                    </p>
                </div>
                <img
                    src={customPropertiesURL}
                    srcSet={`${customProperties2xURL} 2x, ${customProperties3xURL} 3x`}
                    alt="Filter components by custom properties"/>
                <div className={classes.footer}>
                    <p className={classes.p}>
                        See our docs to learn more about CLI hooks and how to add custom properties.
                    </p>
                    <div className={classes.buttons}>
                        <ButtonAnchor href="/l/docs/cli/hooks" target="_blank">See docs</ButtonAnchor>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

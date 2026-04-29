import { useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";
import { matchPath } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { config } from "../../../config/frontend";
import { Button, ButtonKind, ButtonLink } from "../../library/Button/Button";
import { LogoOmlet } from "../../library/logos/LogoOmlet";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

import { AskToJoinPopover } from "./AskToJoinPopover/AskToJoinPopover";

import classes from "./ViewOnlyBanner.module.css";

export function ViewOnlyBanner() {
    const askToJoinButtonRef = useRef<HTMLButtonElement>(null);
    const [askToJoinPopoverOpen, setAskToJoinPopoverOpen] = useState(false);

    const [email, setEmail] = useState("");

    const { selectors: { getUser, getWorkspace } } = useStore();
    const user = getUser();
    const workspace = getWorkspace()!;

    const pageType = useMemo(() => {
        if ([RoutePath.Dashboard, RoutePath.SavedCharts].some(path => matchPath(path, window.location.pathname) !== null)) {
            return "dashboard";
        } else {
            return "chart";
        }
    }, [location.pathname]);

    const loginURL = useMemo(() => {
        const url = new URL(RoutePath.Login, config.APP_BASE_URL);
        url.searchParams.set("redirect", encodeURIComponent(window.location.href));

        return url.toString();
    }, []);

    function handleAskToJoinSuccess(email: string) {
        setEmail(email);
        setAskToJoinPopoverOpen(false);
    }

    function renderContent() {
        if (email) {
            return `We’ve let the workspace admins know. Once they approve, we’ll email you at ${email}.`;
        }

        return `You’re viewing your design system team’s ${pageType} at Omlet. Ask to join this Omlet workspace to interact with the charts and get more insights.`;
    }

    function renderButtons() {
        if (email) {
            return null;
        }

        return (
            <>
                <Button
                    ref={askToJoinButtonRef}
                    onClick={() => setAskToJoinPopoverOpen(true)}>
                    Ask to join workspace
                </Button>
                {!user && (
                    <ButtonLink
                        kind={ButtonKind.Inverse}
                        to={loginURL}>
                        Login
                    </ButtonLink>
                )}
            </>
        );
    }

    return createPortal(
        <div className={classes.viewOnlyBanner}>
            <LogoOmlet size={32} backgroundType="dark"/>
            <p className={classes.content}>
                {renderContent()}
            </p>
            {renderButtons()}
            {askToJoinPopoverOpen && (
                <AskToJoinPopover
                    anchor={askToJoinButtonRef.current!}
                    workspace={workspace}
                    userEmail={user?.email}
                    onSuccess={handleAskToJoinSuccess}
                    onClose={() => setAskToJoinPopoverOpen(false)}/>
            )}
        </div>,
        document.body
    );
}

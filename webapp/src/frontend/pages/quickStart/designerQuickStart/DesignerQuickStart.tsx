import { useEffect, useRef, useState } from "react";

import { generatePath, Link, useNavigate, useParams } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import { config } from "../../../../config/frontend";
import { getMe, getWorkspace as getWorkspaceBySlug, getWorkspaceInviteLinkCode } from "../../../api/api";
import exporeDemoWorkspaceImageURL from "../../../assets/img/imgExploreDemoWorkspace.png";
import exporeDemoWorkspaceImage2xURL from "../../../assets/img/imgExploreDemoWorkspace@2x.png";
import exporeDemoWorkspaceImage3xURL from "../../../assets/img/imgExploreDemoWorkspace@3x.png";
import quickStartScanAnimationURL from "../../../assets/img/imgQucikStartScan.gif";
import watchDemoImageURL from "../../../assets/img/imgWatchDemo.png";
import watchDemoImage2xURL from "../../../assets/img/imgWatchDemo@2x.png";
import watchDemoImage3xURL from "../../../assets/img/imgWatchDemo@3x.png";
import { Header } from "../../../containers/header/Header";
import { InviteDialog } from "../../../containers/header/inviteDialog/InviteDialog";
import { MainHeaderButton } from "../../../containers/header/mainHeaderButton/MainHeaderButton";
import { Button, ButtonKind } from "../../../library/Button/Button";
import { H2, H3 } from "../../../library/Heading/Heading";
import { IconCheck } from "../../../library/icons/IconCheck";
import { IconLink } from "../../../library/icons/IconLink";
import { logError } from "../../../logger";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { PlayerType, YoutubePlayer } from "../../popularCharts/youtubePlayer/YoutubePlayer";

import classes from "./DesignerQuickStart.module.css";

const SETUP_TIMEOUT = 5000;
const COPIED_INDICATOR_TIMEOUT = 1500;

export function DesignerQuickStart() {
    const { workspaceSlug } = useParams();
    const navigate = useNavigate();

    const [inviteLink, setInviteLink] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const inviteButtonRef = useRef<HTMLButtonElement>(null);
    const timeoutRef = useRef<number>();
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [demoVideoOpen, setDemoVideoOpen] = useState(false);

    const {
        actions: {
            setUser,
            setWorkspace,
        },
    } = useStore();

    function handleCopyInviteLink() {
        window.navigator.clipboard.writeText(inviteLink);

        setIsCopied(true);
        window.setTimeout(() => {
            setIsCopied(false);
        }, COPIED_INDICATOR_TIMEOUT);
    }

    async function fetchUser() {
        try {
            const user = await getMe();

            setUser(user);
        } catch (error) {
            logError(error);
        }
    }

    async function fetchWorkspace() {
        try {
            if (!workspaceSlug) {
                return;
            }
            const { workspace, accessLevel } = await getWorkspaceBySlug(workspaceSlug);

            setWorkspace(workspace, accessLevel);

            const { projects } = workspace;

            if (projects.length) {
                navigate(generatePath(RoutePath.RepoHome, { workspaceSlug }), { replace: true });
            } else {
                timeoutRef.current = window.setTimeout(() => {
                    fetchWorkspace();
                }, SETUP_TIMEOUT);
            }
        } catch (error) {
            navigate("/", { replace: true });
            logError(error);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        fetchWorkspace();
        return () => window.clearTimeout(timeoutRef.current);
    }, [workspaceSlug]);

    useEffect(() => {
        async function fetchInviteLink() {
            if (!workspaceSlug) {
                return;
            }

            const { code } = await getWorkspaceInviteLinkCode(workspaceSlug);
            const path = generatePath(RoutePath.InviteLink, { workspaceSlug, code });

            setInviteLink(new URL(path, config.APP_BASE_URL).toString());
        }

        fetchInviteLink();
    }, [workspaceSlug]);

    return (
        <>
            <Header
                leftContent={<MainHeaderButton/>}
                hideRightContent/>
            <main className={classes.designerQuickStart}>
                <div className={classes.content}>
                    <section className={classes.setup}>
                        <H2 className={classes.h2}>Let’s set up Omlet</H2>
                        <p>
                            Omlet requires scanning your codebase. If you’re not the person who can scan,{" "}
                            you can invite a developer to scan your repositories.
                        </p>
                        <img
                            src={quickStartScanAnimationURL}
                            srcSet={`${quickStartScanAnimationURL} 2x`}
                            alt="Scan your codebase to access insights related to the design system usage in your company."/>
                    </section>
                    <section className={classes.invite}>
                        <H3>Invite a teammate to scan</H3>
                        <p>
                            Invite a developer teammate who has access to your codebase. Once they scan the codebase,{" "}
                            you can access all the insights Omlet provides related to the design system usage in your company.
                        </p>
                        <div className={classes.inviteButtons}>
                            <Button
                                className={classes.copyInviteLinkButton}
                                icon={isCopied ? <IconCheck/> : <IconLink/>}
                                onClick={handleCopyInviteLink}>
                                {isCopied ? "Copied!" : "Copy invite link"}
                            </Button>
                            <Button
                                ref={inviteButtonRef}
                                kind={ButtonKind.Secondary}
                                active={inviteDialogOpen}
                                onClick={() => setInviteDialogOpen(true)}>
                                Invite
                            </Button>
                        </div>
                        <p className={classes.scanTip}>
                            Able to scan yourself?{" "}
                            <Link to={generatePath(RoutePath.DeveloperQuickStart, { workspaceSlug: workspaceSlug! })}>
                                View scan instructions
                            </Link>
                        </p>
                    </section>
                    <section className={classes.explore}>
                        <H3>Explore a real-life Omlet workspace</H3>
                        <p>
                            While waiting for a scan, you can play around with our public demo workspace or watch our demo.
                        </p>
                        <div className={classes.demos}>
                            <Link
                                to={generatePath(RoutePath.Dashboard, { workspaceSlug: config.DEMO_WORKSPACE_SLUG })}
                                target="_blank">
                                <img
                                    src={exporeDemoWorkspaceImageURL}
                                    srcSet={`${exporeDemoWorkspaceImage2xURL} 2x, ${exporeDemoWorkspaceImage3xURL} 3x`}
                                    alt="Explore demo workspace"/>
                            </Link>
                            <button onClick={() => setDemoVideoOpen(true)}>
                                <img
                                    src={watchDemoImageURL}
                                    srcSet={`${watchDemoImage2xURL} 2x, ${watchDemoImage3xURL} 3x`}
                                    alt="Watch demo video"/>
                            </button>
                        </div>
                    </section>
                </div>
            </main>
            {inviteDialogOpen &&
                <InviteDialog
                    anchor={inviteButtonRef.current!}
                    hideInviteLink
                    hideCurrentUser
                    inviteToScan
                    onClose={() => setInviteDialogOpen(false)}/>
            }
            {demoVideoOpen &&
                <YoutubePlayer
                    videoId="8mr7e2ivUoo"
                    type={PlayerType.FullPage}
                    onClose={() => setDemoVideoOpen(false)}/>
            }
        </>
    );
}

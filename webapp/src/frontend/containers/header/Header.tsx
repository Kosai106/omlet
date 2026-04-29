import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import classNames from "classnames";
import { useLocation, useParams, useSearchParams } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { pluralize } from "../../../common/utils";
import { config } from "../../../config/frontend";
import { getDataIssues, getWorkspaceJoinRequests } from "../../api/api";
import { Badge } from "../../library/Badge/Badge";
import { Button, ButtonKind, ButtonLink } from "../../library/Button/Button";
import { HeaderHighlightButton, HighlightButtonKind } from "../../library/HeaderButton/HeaderButton";
import { WordMarkOmlet } from "../../library/logos/WordMarkOmlet";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { usePreferencesStore } from "../../providers/PreferencesStoreProvider/PreferencesStoreProvider";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

import { DataIssueDialog } from "./DataIssueDialog/DataIssueDialog";
import { Alignment, HeaderMenu } from "./headerMenu/HeaderMenu";
import { InviteDialog } from "./inviteDialog/InviteDialog";
import { LandingPageAnchor } from "./landingPageButton/LandingPageAnchor";
import { LandingPageButtonKind } from "./landingPageButton/LandingPageButton";
import { LandingPageLink } from "./landingPageButton/LandingPageLink";

import classes from "./Header.module.css";

const DATA_ISSUE_DIALOG_OPEN_SEARCH_PARAM = "data_issue_dialog_open";

interface Props {
    leftContent: ReactNode;
    centerContent?: ReactNode;
    hideRightContent?: boolean;
}

export function Header({
    leftContent,
    centerContent,
    hideRightContent = false,
}: Props) {
    const location = useLocation();
    const { workspaceSlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const inviteButtonRef = useRef<HTMLButtonElement>(null);
    const learnButtonRef = useRef<HTMLButtonElement>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [joinRequestCount, setJoinRequestCount] = useState<number>();
    const [learnMenuOpen, setLearnMenuOpen] = useState(false);

    const dataIssueDialogOpen = searchParams.get(DATA_ISSUE_DIALOG_OPEN_SEARCH_PARAM) === "true";

    const loginURL = useMemo(() => {
        const url = new URL(RoutePath.Login, config.APP_BASE_URL);
        url.searchParams.set("redirect", encodeURIComponent(window.location.href));

        return url.toString();
    }, []);

    const {
        actions: {
            setIsSetupRegularScansDialogVisible,
            setIsScanMoreProjectsDialogVisible,
        },
        selectors: {
            getUser,
            getWorkspace,
            getAccessLevel,
            getIsCreateNewAnalysisButtonVisible,
        },
    } = useStore();

    const { actions: { markDataIssuesSeen }, selectors: { getIsDataIssuesDialogSeen } } = usePreferencesStore();

    const user = getUser();
    const workspace = getWorkspace();
    const accessLevel = getAccessLevel();
    const isCreateNewAnalysisButtonVisible = getIsCreateNewAnalysisButtonVisible();

    const {
        data: {
            data: dataIssues = [],
            meta: {
                dataIssueCount = 0,
            } = {},
        } = {} } = useQuery({
        queryKey: ["dataIssues", workspaceSlug],
        queryFn: () => {
            return getDataIssues(workspaceSlug!);
        },
        enabled: workspaceSlug !== undefined && user !== null && !hideRightContent &&
            (accessLevel === AccessLevel.Full || accessLevel === AccessLevel.ReadOnly),
    });

    const hasDataIssues = dataIssueCount > 0;
    const isDataIssuesDialogSeen = getIsDataIssuesDialogSeen();

    function handleDataIssueButtonClick() {
        markDataIssuesSeen(user!.id);

        setSearchParams(
            searchParams => {
                searchParams.set(DATA_ISSUE_DIALOG_OPEN_SEARCH_PARAM, "true");
                return searchParams;
            },
            { replace: true }
        );
    }

    function handleDataIssueDialogClose() {
        setSearchParams(
            searchParams => {
                searchParams.delete(DATA_ISSUE_DIALOG_OPEN_SEARCH_PARAM);
                return searchParams;
            },
            { replace: true }
        );
    }

    useEffect(() => {
        async function fetchWorkspaceJoinRequests() {
            if (!workspace || hideRightContent || !user || accessLevel !== AccessLevel.Full) {
                return;
            }

            try {
                const joinRequests = await getWorkspaceJoinRequests(workspace.slug);

                setJoinRequestCount(joinRequests.length);
            } catch (error) {
                logError(error);
            }
        }

        fetchWorkspaceJoinRequests();
    }, [workspace, hideRightContent, user, accessLevel]);

    useEffect(() => {
        if (location.hash === "#invites") {
            setInviteDialogOpen(true);
        }
    }, [location.hash]);

    function renderTopContent() {
        if (accessLevel !== AccessLevel.ReadOnly) {
            return null;
        }

        function renderTopRightContent() {
            if (user === null) {
                return (
                    <>
                        <LandingPageLink label="Login" to={loginURL} kind={LandingPageButtonKind.Secondary}/>
                        <LandingPageLink label="Signup" to={loginURL}/>
                    </>
                );
            }

            return <LandingPageLink label="Go to your workspace" to="/" kind={LandingPageButtonKind.Secondary}/>;
        }

        return (
            <div className={classes.topContent}>
                <div className={classes.topContentSide}>
                    <a href={config.LANDING_PAGE_BASE_URL} className={classes.wordMark}>
                        <WordMarkOmlet/>
                    </a>
                    <LandingPageAnchor label="Documentation" href="/l/docs" kind={LandingPageButtonKind.Secondary}/>
                </div>
                <div className={classes.topContentSide}>
                    {renderTopRightContent()}
                </div>
            </div>
        );
    }

    function renderRightContent() {
        if (hideRightContent) {
            return null;
        }

        if (!user) {
            return accessLevel === AccessLevel.ReadOnly ? null : (
                <ButtonLink
                    kind={ButtonKind.Inverse}
                    to={loginURL}>
                    Login
                </ButtonLink>
            );
        }

        if (accessLevel === AccessLevel.ReadOnly) {
            return (
                <>
                    <ButtonLink
                        className={classNames(classes.newAnalysisButton, { [classes.visible]: !hasDataIssues && isCreateNewAnalysisButtonVisible })}
                        to="analytics/view">
                        Create new analysis
                    </ButtonLink>
                    {hasDataIssues && (
                        <HeaderHighlightButton
                            kind={HighlightButtonKind.Warning}
                            label={isDataIssuesDialogSeen ? dataIssueCount.toString() : pluralize("issue", dataIssueCount)}
                            onClick={handleDataIssueButtonClick} />
                    )}
                </>
            );
        }

        if (accessLevel !== AccessLevel.Full) {
            return null;
        }

        return (
            <>
                <ButtonLink
                    className={classNames(classes.newAnalysisButton, { [classes.visible]: !hasDataIssues && isCreateNewAnalysisButtonVisible })}
                    to="analytics/view">
                    Create new analysis
                </ButtonLink>
                {hasDataIssues && (
                    <HeaderHighlightButton
                        kind={HighlightButtonKind.Warning}
                        label={isDataIssuesDialogSeen ? dataIssueCount.toString() : pluralize("issue", dataIssueCount)}
                        onClick={handleDataIssueButtonClick} />
                )}
                <button
                    ref={learnButtonRef}
                    type="button"
                    className={classes.seamlessButton}
                    onClick={() => setLearnMenuOpen(true)}>
                    Learn
                </button>
                <Badge value={inviteDialogOpen ? undefined : joinRequestCount}>
                    <Button
                        ref={inviteButtonRef}
                        kind={ButtonKind.Inverse}
                        active={inviteDialogOpen}
                        onClick={() => setInviteDialogOpen(true)}>
                        Invite
                    </Button>
                </Badge>
            </>
        );
    }

    return (
        <header className={classes.header}>
            {renderTopContent()}
            <div className={classes.mainContent}>
                <div className={classes.leftContent}>
                    {leftContent}
                </div>
                {centerContent}
                <div className={classes.rightContent}>
                    {renderRightContent()}
                </div>
                {inviteDialogOpen && (
                    <InviteDialog
                        anchor={inviteButtonRef.current!}
                        onJoinRequestCountChange={setJoinRequestCount}
                        onClose={() => setInviteDialogOpen(false)}/>
                )}
                {learnMenuOpen && (
                    <HeaderMenu
                        buttonRect={learnButtonRef.current!.getBoundingClientRect()}
                        alignment={Alignment.Right}
                        offsetX={-12}
                        offsetY={-3}
                        onOverlayClick={() => setLearnMenuOpen(false)}>
                        <button
                            type="button"
                            onClick={() => setIsSetupRegularScansDialogVisible(true)}>
                            Set up regular scans
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsScanMoreProjectsDialogVisible(true)}>
                            Scan more projects
                        </button>
                        <a
                            href="/l/docs/tag-components"
                            rel="nofollow external noopener noreferrer"
                            target="_blank">
                            Manage tags
                        </a>
                        <hr/>
                        <a
                            href="/l/docs/cli"
                            rel="nofollow external noopener noreferrer"
                            target="_blank">
                            Go to Documentation
                        </a>
                    </HeaderMenu>
                )}
                {dataIssues.length > 0 && dataIssueDialogOpen && <DataIssueDialog
                    dataIssues={dataIssues}
                    dataIssueCount={dataIssueCount}
                    onClose={handleDataIssueDialogClose} />
                }
            </div>
        </header>
    );
}

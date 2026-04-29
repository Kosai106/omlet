import { useEffect, useState } from "react";

import classNames from "classnames";
import {
    generatePath,
    matchPath,
    Outlet,
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import { hasCoreTag } from "../../../common/models/Tag";
import { RoutePath } from "../../../common/RoutePath";
import { APIError, APIErrorCode, getMe, getWorkspace as getWorkspaceBySlug } from "../../api/api";
import { Header } from "../../containers/header/Header";
import { MainHeaderButton } from "../../containers/header/mainHeaderButton/MainHeaderButton";
import { Tabs } from "../../containers/header/tabs/Tabs";
import { ViewOnlyBanner } from "../../containers/ViewOnlyBanner/ViewOnlyBanner";
import { HeaderButton } from "../../library/HeaderButton/HeaderButton";
import { IconBack } from "../../library/icons/IconBack";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { usePreferencesStore } from "../../providers/PreferencesStoreProvider/PreferencesStoreProvider";
import { userPreferences } from "../../providers/PreferencesStoreProvider/storage";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

import { AddMoreTagsDialog } from "./addMoreTagsDialog/AddMoreTagsDialog";
import { RenameProjectsDialog } from "./renameProjectsDialog/RenameProjectsDialog";
import { ScanMoreProjectsDialog } from "./scanMoreProjectsDialog/ScanMoreProjectsDialog";
import { SetupRegularScansDialog } from "./setupRegularScansDialog/SetupRegularScansDialog";

import classes from "./AppShell.module.css";
import headerClasses from "../../containers/header/Header.module.css";

interface LocationState {
    fromApp?: boolean;
}

export function AppShell() {
    const {
        actions: {
            setUser,
            setWorkspace,
            setAnalyticsURL,
            setComponentsURL,
            setDashboardURL,
        },
        selectors: {
            getWorkspace,
            getAccessLevel,
            getIsSetupRegularScansDialogVisible,
            getIsScanMoreProjectsDialogVisible,
            getIsAddMoreTagsDialogVisible,
            getIsRenameProjectDialogVisible,
        },
    } = useStore();
    const { actions: { initUserPreferences } } = usePreferencesStore();

    const { workspaceSlug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [title, setTitle] = useState<string | null>(null);
    const workspace = getWorkspace();
    const accessLevel = getAccessLevel();
    const locationState = location.state as (null | LocationState);

    function handleBackClick() {
        if (locationState?.fromApp) {
            return navigate(-1);
        }

        navigate(generatePath(RoutePath.Dashboard, { workspaceSlug: workspaceSlug! }));
    }

    useEffect(() => {
        async function fetchData() {
            if (!workspaceSlug) {
                return;
            }

            try {
                const { workspace, accessLevel } = await getWorkspaceBySlug(workspaceSlug);

                setWorkspace(workspace, accessLevel);

                if (workspace.projects.length === 0) {
                    navigate(generatePath(RoutePath.QuickStart, { workspaceSlug: workspace.slug }), { replace: true });
                    return;
                }

                if (!hasCoreTag(workspace.tags)) {
                    navigate(generatePath(RoutePath.Onboarding, { workspaceSlug: workspaceSlug }), { replace: true });
                    return;
                }

            } catch (error) {
                if (error instanceof APIError && error.code === APIErrorCode.UNAUTHORIZED) {
                    const redirectURL = `${location.pathname}${location.search}${location.hash}`;
                    navigate(`${RoutePath.Login}?redirect=${encodeURIComponent(redirectURL)}`, { replace: true });
                    return;
                }

                navigate("/", { replace: true });
                logError(error);
            }
        }

        fetchData();

        const dashboardURL = generatePath(RoutePath.Dashboard, { workspaceSlug: workspaceSlug! });
        setAnalyticsURL(dashboardURL);
        setComponentsURL(generatePath(RoutePath.Components, { workspaceSlug: workspaceSlug! }));

        if ([RoutePath.SavedChart, RoutePath.SavedCharts].some(path => matchPath(path, location.pathname) !== null)) {
            setDashboardURL(generatePath(RoutePath.SavedCharts, { workspaceSlug: workspaceSlug! }));
        } else {
            setDashboardURL(dashboardURL);
        }
    }, [workspaceSlug]);

    useEffect(() => {
        async function fetchData() {
            try {
                const user = await getMe();

                setUser(user);

                const preferences = await userPreferences.getAll(user.id);
                initUserPreferences(preferences);
            } catch (error) {
                logError(error);
            }
        }

        fetchData();
    }, []);

    function renderMainHeaderButton() {
        if (title) {
            return (
                <HeaderButton
                    icon={<IconBack/>}
                    label="Back"
                    onClick={handleBackClick}/>
            );
        }

        return (
            <MainHeaderButton
                showAllScans={accessLevel !== AccessLevel.Page}
                showRenameProjects={accessLevel === AccessLevel.Full}
            />
        );
    }

    function renderCenterContent() {
        if (accessLevel === AccessLevel.Page) {
            return null;
        }

        if (title) {
            return <h1 className={headerClasses.title}>{title}</h1>;
        }

        return <Tabs/>;
    }

    if (!workspace) {
        return null;
    }

    const isSetupRegularScansDialogVisible = getIsSetupRegularScansDialogVisible();
    const isScanMoreProjectsDialogVisible = getIsScanMoreProjectsDialogVisible();
    const isAddMoreTagsDialogVisible = getIsAddMoreTagsDialogVisible();
    const isRenameProjectDialogVisible = getIsRenameProjectDialogVisible();

    return (
        <>
            <Header
                leftContent={renderMainHeaderButton()}
                centerContent={renderCenterContent()}/>
            <div className={classNames({ [classes.withTallHeader]: accessLevel === AccessLevel.ReadOnly })}>
                <Outlet context={setTitle}/>
            </div>
            {isSetupRegularScansDialogVisible && <SetupRegularScansDialog/>}
            {isScanMoreProjectsDialogVisible && <ScanMoreProjectsDialog/>}
            {isAddMoreTagsDialogVisible && <AddMoreTagsDialog/>}
            {isRenameProjectDialogVisible && <RenameProjectsDialog/>}
            {accessLevel === AccessLevel.Page && <ViewOnlyBanner/>}
        </>
    );
}

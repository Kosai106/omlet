import { type PropsWithChildren, useEffect } from "react";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import {
    type LoaderFunctionArgs,
    Navigate,
    Outlet,
    Route,
    RouterProvider,
    createBrowserRouter,
    createRoutesFromElements,
    useBeforeUnload,
    useOutletContext,
} from "react-router-dom";

import { RoutePath } from "../common/RoutePath";
import { config } from "../config/frontend";

import { authenticateSharedPage, invalidateSharedPageAuthentication, getWorkspace as getWorkspaceBySlug } from "./api/api";
import { WindowSizeProvider } from "./hooks/useWindowSize";
import { ToastProvider, useToast } from "./library/Toast/Toast";
import { AllScans } from "./pages/allScans/AllScans";
import { AnalyticsShell } from "./pages/analyticsShell/AnalyticsShell";
import { AppShell } from "./pages/appShell/AppShell";
import { Auth } from "./pages/auth/Auth";
import { CliLoginSuccess } from "./pages/auth/CliLoginSuccess";
import { LoginSuccess } from "./pages/auth/LoginSuccess";
import { LoginWithEmail } from "./pages/auth/LoginWithEmail";
import { ComponentDetail } from "./pages/componentDetail/ComponentDetail";
import { Components } from "./pages/components/Components";
import { CreateWorkspace } from "./pages/createWorkspace/CreateWorkspace";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Default } from "./pages/default/Default";
import { InvalidInvite } from "./pages/invalidInvite/InvalidInvite";
import { NewAnalytics } from "./pages/newAnalytics/NewAnalytics";
import { Onboarding } from "./pages/onboarding/Onboarding";
import { PopularCharts } from "./pages/popularCharts/PopularCharts";
import { Props } from "./pages/props/Props";
import { DesignerQuickStart } from "./pages/quickStart/designerQuickStart/DesignerQuickStart";
import { DeveloperQuickStart } from "./pages/quickStart/developerQuickStart/DeveloperQuickStart";
import { QuickStart } from "./pages/quickStart/QuickStart";
import { RawHtml } from "./pages/rawHtml/RawHtml";
import { SavedChart } from "./pages/savedChart/SavedChart";
import { SavedCharts } from "./pages/savedCharts/SavedCharts";
import { SelectProfession } from "./pages/selectProfession/SelectProfession";
import { Tutorial } from "./pages/tutorial/Tutorial";
import { DataCacheProvider } from "./providers/DataCacheProvider/DataCacheProvider";
import { PreferencesStoreProvider } from "./providers/PreferencesStoreProvider/PreferencesStoreProvider";
import { StoreProvider, useStore } from "./providers/StoreProvider/StoreProvider";

interface TitleWrapperProps {
    title: string;
}

function TitleWrapper({ title, children }: PropsWithChildren<TitleWrapperProps>) {
    const setTitle = useOutletContext<(title:string | null) => void>();
    useEffect(() => {
        setTitle(title);
        return () => setTitle(null);
    }, [title]);
    return <>
        {children}
    </>;
}

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            loader={rootLoader}
            element={
                <ToastProvider>
                    <Root/>
                </ToastProvider>
            }>
            <Route path={RoutePath.Login} element={<Auth/>}/>
            <Route path={RoutePath.LoginWithEmail} element={config.EMAILS_ENABLED ? <LoginWithEmail/> : <Default/>}/>
            <Route path={RoutePath.CliLoginSuccess} element={<CliLoginSuccess/>}/>
            <Route path={RoutePath.LoginSuccess} element={<LoginSuccess/>}/>
            <Route path={RoutePath.InvalidInvite} element={<InvalidInvite/>}/>
            <Route path={RoutePath.SelectProfession} element={<SelectProfession/>}/>
            <Route path={RoutePath.CreateWorkspace} element={<CreateWorkspace/>}/>
            <Route path={RoutePath.Tutorial} element={<Tutorial/>}/>
            <Route path={RoutePath.QuickStart}>
                <Route index element={<QuickStart/>}/>
                <Route path="developer" element={<DeveloperQuickStart/>}/>
                <Route path="designer" element={<DesignerQuickStart/>}/>
            </Route>
            <Route path={RoutePath.Onboarding} element={<Onboarding/>}/>
            <Route path={RoutePath.RepoHome} element={<DataCacheProvider><AppShell/></DataCacheProvider>}>
                <Route path="all-scans" element={
                    <TitleWrapper title="All Scans">
                        <AllScans/>
                    </TitleWrapper>
                }/>
                <Route path="analytics" element={<AnalyticsShell/>}>
                    <Route element={<Dashboard/>}>
                        <Route index element={<PopularCharts/>}/>
                        <Route path="saved-charts" element={<SavedCharts/>}/>
                    </Route>
                    <Route path="saved-charts/:savedChartSlug" element={<SavedChart/>}/>
                    <Route path="view" element={<NewAnalytics/>}/>
                </Route>
                <Route path="components">
                    <Route index element={<Components/>}/>
                    <Route path=":componentSlug/:activeTab?" element={<ComponentDetail/>}/>
                </Route>
                <Route path="props" element={<Props/>}/>
                <Route path="raw-html" element={<RawHtml/>}/>
                <Route path="manage-tags" element={
                    <Navigate to="../components"/>
                }/>
                <Route path="data-issues" element={<Navigate to={{ pathname: "../analytics", search: "?data_issue_dialog_open=true" }} replace />}/>
                {["", "*"].map((path, idx) => (
                    <Route path={path} element={<Navigate to="analytics" replace/>} key={idx}/>
                ))}
            </Route>
            <Route path={RoutePath.Unknown} element={<Default/>}/>
        </Route>
    )
);

async function rootLoader({ request }: LoaderFunctionArgs) {
    const page = new URL(request.url);
    const code = page.searchParams.get("token");

    if (code) {
        await authenticateSharedPage(code);
    }

    return null;
}

function Root() {
    const toast = useToast();
    const {
        selectors: {
            getWorkspace,
        },
    } = useStore();
    const workspace = getWorkspace();

    useBeforeUnload(() => {
        invalidateSharedPageAuthentication();
    });

    useEffect(() => {
        if (workspace?.analysisInProgress) {
            toast.show("Analysis in progress…", Infinity);

            const intervalId = window.setInterval(async () => {
                const updatedWorkspace = await getWorkspaceBySlug(workspace.slug);

                if (!updatedWorkspace.workspace.analysisInProgress) {
                    window.clearInterval(intervalId);
                    toast.hide();
                }
            }, 5000);

            return () => {
                window.clearInterval(intervalId);
            };
        }
    }, [workspace?.analysisInProgress]);

    return <Outlet/>;
}

const queryClient = new QueryClient();
export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <WindowSizeProvider>
                <StoreProvider>
                    <PreferencesStoreProvider>
                        <RouterProvider router={router}/>
                    </PreferencesStoreProvider>
                </StoreProvider>
            </WindowSizeProvider>
        </QueryClientProvider>
    );
}

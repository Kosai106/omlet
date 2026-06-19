import { matchPath } from "react-router-dom";

export enum RoutePath {
    Login = "/login",
    LoginWithEmail = "/login/email",
    LoginWithTestUser = "/login/test",
    CliLoginSuccess = "/login/cli-success",
    LoginSuccess = "/login/success",
    InviteLink = "/invite/:workspaceSlug/:code",
    InvalidInvite = "/invalid-invite",
    SelectProfession = "/select-profession",
    CreateWorkspace = "/create-workspace",
    Tutorial = "/tutorial",
    RepoHome = "/:workspaceSlug",
    AllScans = "/:workspaceSlug/all-scans",
    Dashboard = "/:workspaceSlug/analytics",
    SavedCharts = "/:workspaceSlug/analytics/saved-charts",
    NewAnalytics = "/:workspaceSlug/analytics/view",
    SavedChart = "/:workspaceSlug/analytics/saved-charts/:savedChartSlug",
    Components = "/:workspaceSlug/components",
    ComponentDetail = "/:workspaceSlug/components/:componentSlug",
    Props = "/:workspaceSlug/props",
    CoreSelection = "/:workspaceSlug/manage-tags/core",
    Onboarding = "/:workspaceSlug/onboarding",
    QuickStart = "/:workspaceSlug/quick-start",
    DesignerQuickStart = "/:workspaceSlug/quick-start/designer",
    DeveloperQuickStart = "/:workspaceSlug/quick-start/developer",
    Unknown = "*",
}

export function getMatchingRouteInfo(pathname: string): {
    page: string;
    route: RoutePath;
} {
    const path = Object.entries(RoutePath).find(([_, value]) => matchPath(value, pathname));
    if (path) {
        return {
            page: path[0],
            route: path[1],
        };
    }

    return {
        page: "Unknown",
        route: RoutePath.Unknown,
    };
}

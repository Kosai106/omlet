import { useEffect } from "react";

import { Outlet, generatePath, useParams } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

export function AnalyticsShell() {
    const { workspaceSlug } = useParams();

    const { actions: { setComponentsURL, setComponentsScrollPosition } } = useStore();

    useEffect(() => {
        setComponentsURL(generatePath(RoutePath.Components, { workspaceSlug: workspaceSlug! }));
        setComponentsScrollPosition(0);
    }, []);

    return <Outlet/>;
}

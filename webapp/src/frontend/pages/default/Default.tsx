import { useEffect } from "react";

import { generatePath, useNavigate } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { APIError, APIErrorCode, getDefaultWorkspace } from "../../api/api";
import { logError } from "../../logger";

export function Default() {
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchData() {
            try {
                const workspace = await getDefaultWorkspace();

                if (workspace) {
                    navigate(generatePath(RoutePath.RepoHome, { workspaceSlug: workspace.slug }), { replace: true });
                } else {
                    navigate(RoutePath.CreateWorkspace, { replace: true });
                }
            } catch (error) {
                if (error instanceof APIError && error.code === APIErrorCode.UNAUTHORIZED) {
                    navigate(RoutePath.Login, { replace: true });
                    return;
                }

                logError(error);
            }
        }

        fetchData();
    }, []);

    return null;
}

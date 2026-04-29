import { useEffect } from "react";

import { generatePath, useNavigate, useParams } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { getMe, getWorkspace as getWorkspaceBySlug } from "../../api/api";
import { logError } from "../../logger";
import { Profession } from "../../models/Profession";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

export function QuickStart() {
    const { workspaceSlug } = useParams();
    const navigate = useNavigate();

    const { actions: { setUser, setWorkspace } } = useStore();

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, { workspace, accessLevel }] = await Promise.all([
                    getMe(),
                    getWorkspaceBySlug(workspaceSlug!),
                ]);

                setUser(user);
                setWorkspace(workspace, accessLevel);

                const quickStartPath = !user.profession || user.profession === Profession.Developer
                    ? RoutePath.DeveloperQuickStart
                    : RoutePath.DesignerQuickStart;

                navigate(generatePath(quickStartPath, { workspaceSlug: workspaceSlug! }));
            } catch (error) {
                navigate("/", { replace: true });
                logError(error);
            }
        }

        fetchData();
    }, []);

    return <></>;
}

import { useEffect } from "react";

import { generatePath, useNavigate, useSearchParams } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { APIError, APIErrorCode, getDefaultWorkspace, getMe } from "../../api/api";
import { useToast } from "../../library/Toast/Toast";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { LoginType } from "../../models/LoginType";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

export function LoginSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { actions: { setUser, setWorkspace } } = useStore();
    const toast = useToast();

    const loginType = searchParams.get("type") as LoginType | null;

    const toastMessage = (
        loginType === LoginType.EmailChange
            ? "Email changed successfully"
            : "Logged in successfully"
    );

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, workspace] = await Promise.all([
                    getMe(),
                    getDefaultWorkspace(),
                ]);

                toast.show(toastMessage);

                setUser(user);

                if (loginType === LoginType.NewUser && !user.profession) {
                    navigate(RoutePath.SelectProfession, { replace: true });
                } else if (workspace) {
                    setWorkspace(workspace, AccessLevel.Full);
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

    return <></>;
}

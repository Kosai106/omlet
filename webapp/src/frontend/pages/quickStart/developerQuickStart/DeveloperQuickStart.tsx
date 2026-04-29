import { useEffect, useRef } from "react";

import { generatePath, useNavigate, useParams } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import { getMe, getWorkspace as getWorkspaceBySlug } from "../../../api/api";
import { Header } from "../../../containers/header/Header";
import { MainHeaderButton } from "../../../containers/header/mainHeaderButton/MainHeaderButton";
import { CodeSnippet } from "../../../library/CodeSnippet/CodeSnippet";
import { H2, H3 } from "../../../library/Heading/Heading";
import { logError } from "../../../logger";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";

import classes from "./DeveloperQuickStart.module.css";

const SETUP_TIMEOUT = 5000;

export function DeveloperQuickStart() {
    const { workspaceSlug } = useParams();
    const navigate = useNavigate();
    const timeoutRef = useRef<number>();

    const {
        actions: {
            setUser,
            setWorkspace,
        },
    } = useStore();

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

    return (
        <>
            <Header
                leftContent={<MainHeaderButton/>}
                hideRightContent/>
            <main className={classes.developerQuickStart}>
                <div className={classes.content}>
                    <section>
                        <H2 className={classes.h2}>
                            Let’s set up Omlet
                            <span className={classes.hint}>
                                {" "}
                                — usually takes less than 5 minutes
                            </span>
                        </H2>
                        <p>
                            To get started, we’ll run the Omlet CLI and scan the components in your codebase.
                            If you’re curious, Omlet never collects, stores or uploads your code.
                            To learn more about security, check our{" "}
                            <a
                                href="/l/docs/security"
                                rel="nofollow external noopener noreferrer"
                                target="_blank">
                                documentation
                            </a>.
                        </p>
                    </section>
                    <section>
                        <H3 className={classes.title}>
                            <span className={classes.step}>1</span>
                            Navigate to the repo that contains your component library
                        </H3>
                    </section>
                    <section>
                        <H3 className={classes.title}>
                            <span className={classes.step}>2</span>
                            Run Omlet CLI
                        </H3>
                        <CodeSnippet.Tabbed
                            className={classes.codeSnippet}
                            code={{
                                npm: "npx @omlet/cli init",
                                yarn: "yarn dlx @omlet/cli init",
                                pnpm: "pnpm dlx @omlet/cli init",
                            }}/>
                        <p className={classes.setupTip}>
                            🥸 Omlet works best when you scan
                            {" "}
                            <strong>both</strong>
                            {" "}
                            your component library,
                            and the repos that use your component library.
                            So if your applications live in a separate repo, have those repos handy as well.
                        </p>
                    </section>
                    <section>
                        <H3 className={classes.title}>
                            <span className={classes.step}>3</span>
                            Follow instructions on CLI 🍿
                        </H3>
                        <p>
                            If you run into any issues, you can check our in-depth
                            {" "}
                            <a
                                href="/l/docs"
                                rel="nofollow external noopener noreferrer"
                                target="_blank">
                                documentation
                            </a>.
                        </p>
                        <p className={classes.setupTip}>
                            If you’re not able to use your own codebase, we recommend{" "}
                            <a
                                href="https://github.com/ProtonMail/WebClients"
                                rel="nofollow external noopener noreferrer"
                                target="_blank">
                                Proton
                            </a>{" "}
                            — a great React open source project.
                        </p>
                    </section>
                </div>
            </main>
        </>
    );
}

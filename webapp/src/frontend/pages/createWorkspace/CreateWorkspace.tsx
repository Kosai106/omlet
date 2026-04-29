import { useEffect, useRef, useState } from "react";

import { generatePath, useNavigate } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { generateSlug } from "../../../common/utils";
import { config } from "../../../config/frontend";
import {
    createWorkspace,
    getDefaultWorkspace,
    getMe,
    getWorkspaceSlugSuggestion,
} from "../../api/api";
import { Header } from "../../containers/header/Header";
import { MainHeaderButton } from "../../containers/header/mainHeaderButton/MainHeaderButton";
import { Button } from "../../library/Button/Button";
import { H2 } from "../../library/Heading/Heading";
import { LogoHome } from "../../library/logos/LogoHome";
import { TextInput } from "../../library/TextInput/TextInput";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { Profession } from "../../models/Profession";
import { usePreferencesStore } from "../../providers/PreferencesStoreProvider/PreferencesStoreProvider";
import { userPreferences } from "../../providers/PreferencesStoreProvider/storage";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

import classes from "./CreateWorkspace.module.css";

const SLUG_CHECK_TIMEOUT = 300;
const PLACEHOLDER_NAME = "Snack Overflow";
const PLACEHOLDER_SLUG = generateSlug(PLACEHOLDER_NAME);

export function CreateWorkspace() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [isSlugVerified, setIsSlugVerified] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const slugCheckTimeout = useRef<number>();

    const { actions: { setUser, setWorkspace }, selectors: { getUser } } = useStore();

    const { actions: { initUserPreferences } } = usePreferencesStore();

    const user = getUser();

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, defaultWorkspace] = await Promise.all([
                    getMe(),
                    getDefaultWorkspace(),
                ]);

                setUser(user);
                const preferences = await userPreferences.getAll(user.id);
                initUserPreferences(preferences);

                if (defaultWorkspace) {
                    setWorkspace(defaultWorkspace, AccessLevel.Full);
                    navigate(generatePath(RoutePath.RepoHome, { workspaceSlug: defaultWorkspace.slug }), { replace: true });
                }
            } catch (error) {
                logError(error);
            }
        }

        fetchData();
    }, []);

    async function setSuggestedSlug(workspaceName: string) {
        try {
            const suggestion = await getWorkspaceSlugSuggestion(workspaceName);
            setSlug(suggestion.slug);
        } catch (error) {
            logError(error);
            setSlug(generateSlug(workspaceName));
        } finally {
            setIsSlugVerified(true);
        }
    }

    function handleInput(value: string) {
        window.clearTimeout(slugCheckTimeout.current);

        setName(value);

        const trimmedValue = value.trim();
        setSlug(generateSlug(trimmedValue));
        setIsSlugVerified(false);

        if (!trimmedValue) {
            return;
        }

        slugCheckTimeout.current = window.setTimeout(() => {
            setSuggestedSlug(trimmedValue);
        }, SLUG_CHECK_TIMEOUT);
    }

    async function handleClick() {
        try {
            setIsCreating(true);
            await createWorkspace(name.trim(), slug);

            if (!user?.profession || user.profession === Profession.Developer) {
                navigate(generatePath(RoutePath.DeveloperQuickStart, { workspaceSlug: slug }), { replace: true });
            } else {
                navigate(generatePath(RoutePath.Tutorial), { replace: true });
            }
        } catch (error) {
            setIsCreating(false);
            logError(error);
        }
    }

    return (
        <>
            <Header
                leftContent={user && <MainHeaderButton/>}
                hideRightContent/>
            <div className={classes.createWorkspace}>
                <main className={classes.main}>
                    <div className={classes.header}>
                        <LogoHome/>
                        <H2 className={classes.h2}>Create your Omlet workspace</H2>
                    </div>
                    <p>
                        Workspaces are where you and your teammates get together to build and access your analytics dashboard and component catalog, by analyzing multiple repositories.
                        <br/>
                        <br/>
                        <span className={classes.giveName}>Give your workspace a name to get started:</span>
                    </p>
                    <div className={classes.form}>
                        <TextInput
                            value={name}
                            placeholder={PLACEHOLDER_NAME}
                            autoFocus
                            onChange={handleInput}/>
                        <Button
                            onClick={handleClick}
                            disabled={isCreating || !name.trim() || !slug || !isSlugVerified}>
                            Create workspace
                        </Button>
                    </div>
                    <output>Your workspace URL will be {config.APP_BASE_URL}/{slug || PLACEHOLDER_SLUG}.</output>
                </main>
            </div>
        </>
    );
}

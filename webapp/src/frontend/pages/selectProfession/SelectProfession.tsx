import { useEffect, useState } from "react";

import { generatePath, useNavigate } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { getDefaultWorkspace, getMe, updateUser } from "../../api/api";
import { Button } from "../../library/Button/Button";
import { H2 } from "../../library/Heading/Heading";
import { LogoChef } from "../../library/logos/LogoChef";
import { logError } from "../../logger";
import { AccessLevel } from "../../models/AccessLevel";
import { Profession } from "../../models/Profession";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

import { OtherProfessionCard } from "./otherProfessionCard/OtherProfessionCard";
import { ProfessionCard } from "./professionCard/ProfessionCard";

import classes from "./SelectProfession.module.css";

export function SelectProfession() {
    const navigate = useNavigate();

    const {
        actions: { setUser, setWorkspace },
        selectors: { getUser, getWorkspace },
    } = useStore();

    const user = getUser();
    const workspace = getWorkspace();

    const [selectedProfession, setSelectedProfession] = useState<Profession | undefined>(user?.profession);

    function handleProfessionChange(profession: Profession) {
        setSelectedProfession(profession);
    }

    async function handleContinueClick() {
        try {
            await updateUser({ profession: selectedProfession });
            setUser({ ...user!, profession: selectedProfession });

            if (workspace) {
                navigate(generatePath(RoutePath.Tutorial), { replace: true });
            } else {
                navigate(RoutePath.CreateWorkspace, { replace: true });
            }
        } catch (error) {
            logError(error);
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const [user, workspace] = await Promise.all([
                    getMe(),
                    getDefaultWorkspace(),
                ]);

                setUser(user);
                setSelectedProfession(user.profession);

                if (workspace) {
                    setWorkspace(workspace, AccessLevel.Full);
                }
            } catch (error) {
                logError(error);
            }
        }

        fetchData();
    }, []);

    return (
        <>
            <header className={classes.header}/>
            <main className={classes.main}>
                <LogoChef className={classes.pageLogo}/>
                <section className={classes.professions}>
                    <H2 className={classes.h2}>What type of work do you do?</H2>
                    <p className={classes.description}>This will help us curate the onboarding experience for you and your team.</p>
                    <ProfessionCard
                        title="I’m a developer"
                        description="I have access to our codebase and can scan components using Omlet’s CLI."
                        value={Profession.Developer}
                        selected={selectedProfession === Profession.Developer}
                        onChange={handleProfessionChange}/>
                    <ProfessionCard
                        title="I’m a designer"
                        description="I don’t have access to the codebase myself, but know teammates who do!"
                        value={Profession.Designer}
                        selected={selectedProfession === Profession.Designer}
                        onChange={handleProfessionChange}/>
                    <OtherProfessionCard
                        value={selectedProfession}
                        onChange={handleProfessionChange}/>
                </section>
                <Button
                    className={classes.continueButton}
                    disabled={selectedProfession === undefined}
                    onClick={handleContinueClick}>
                    Continue
                </Button>
            </main>
        </>
    );
}

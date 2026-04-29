import { useEffect } from "react";

import { getMe } from "../../api/api";
import { Header } from "../../containers/header/Header";
import { MainHeaderButton } from "../../containers/header/mainHeaderButton/MainHeaderButton";
import { Illustration, LogoCard } from "../../library/LogoCard/LogoCard";
import { logError } from "../../logger";
import { useStore } from "../../providers/StoreProvider/StoreProvider";

import classes from "./InvalidInvite.module.css";

export function InvalidInvite() {

    const {
        actions: { setUser },
        selectors: { getUser },
    } = useStore();

    const user = getUser();

    async function fetchUser() {
        try {
            const user = await getMe();

            setUser(user);
        } catch (error) {
            logError(error);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <>
            <Header
                leftContent={user && <MainHeaderButton/>}
                hideRightContent/>
            <main className={classes.main}>
                <div className={classes.column}>
                    <LogoCard title="This link has expired" illustration={Illustration.Angel}>
                        <p className={classes.text}>
                            Ping your teammates for a new one.
                        </p>
                    </LogoCard>
                </div>
            </main>
        </>
    );
}

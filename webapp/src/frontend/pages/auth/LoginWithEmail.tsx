import { type FormEvent, useMemo, useRef, useState } from "react";

import classNames from "classnames";
import { validate } from "email-validator";
import { Link, useSearchParams } from "react-router-dom";

import { RoutePath } from "../../../common/RoutePath";
import { createAuthRequest } from "../../api/api";
import { Button } from "../../library/Button/Button";
import { IconArrow } from "../../library/icons/IconArrow";
import { Illustration, LogoCard } from "../../library/LogoCard/LogoCard";
import { TextInput } from "../../library/TextInput/TextInput";

import authClasses from "./Auth.module.css";
import classes from "./LoginWithEmail.module.css";
import buttonClasses from "../../library/Button/Button.module.css";

function isGmail(email: string): boolean {
    const [, domain] = email.split("@");
    const [firstPart] = domain.split(".");
    return ["googlemail", "gmail", "google"].includes(firstPart.toLowerCase());
}

export function LoginWithEmail() {
    const submitInProgressRef = useRef(false);
    const [searchParams] = useSearchParams();
    const [emailSent, setEmailSent] = useState(false);
    const [email, setEmail] = useState("");
    const shouldShowEmailError = useMemo(() => email && !validate(email), [email]);
    const gmail = useMemo(() => validate(email) && isGmail(email), [email]);

    const cliCallbackUri = searchParams.get("callback_uri") ?? undefined;
    const isCli = searchParams.get("cli") === "true";
    const redirect = searchParams.get("redirect") ?? undefined;

    function getLoginLink() {
        const searchParams = new URLSearchParams();
        if (cliCallbackUri) {
            searchParams.append("callback_uri", cliCallbackUri);
        }
        if (redirect) {
            searchParams.append("redirect", redirect);
        }
        if (isCli) {
            searchParams.append("cli", "true");
        }
        return `${RoutePath.Login}?${searchParams.toString()}`;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (shouldShowEmailError || submitInProgressRef.current) {
            return;
        }
        submitInProgressRef.current = true;
        await createAuthRequest(email, {
            cliCallbackUri,
            redirect,
            cli: isCli,
        });
        setEmailSent(true);
    }

    if (emailSent) {
        return (
            <>
                <header className={authClasses.header}/>
                <main className={classNames(authClasses.main, classes.main)}>
                    <div className={classNames(authClasses.column, classes.emailSentColumn)}>
                        <LogoCard title="Look out for an email" illustration={Illustration.Snitch}>
                            <p>
                                Click the link we just emailed to
                                <br/>
                                <strong>{email}</strong>
                                {" "}
                                to login.
                            </p>
                        </LogoCard>
                        {gmail && (
                            <a
                                href="https://mail.google.com"
                                className={classNames(
                                    buttonClasses.button,
                                    buttonClasses.primary,
                                    buttonClasses.rectangle,
                                    classes.gmailButton
                                )}>
                                Go to Gmail
                            </a>
                        )}
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <header className={authClasses.header}/>
            <main className={authClasses.main}>
                <div className={authClasses.column}>
                    <LogoCard title="Welcome to Omlet">
                        Salutations! Let’s get you in.
                    </LogoCard>
                    <form className={authClasses.forms} onSubmit={handleSubmit}>
                        <p className={authClasses.continueWith}>Continue with email</p>
                        <TextInput placeholder="Your work email" autoFocus className={classes.input} onChange={setEmail} value={email}/>
                        {shouldShowEmailError && <span className={classes.error}>Email doesn’t look right.</span>}
                        <Button type="submit" className={classes.button}>
                            Continue with email
                        </Button>
                    </form>
                    <Link className={authClasses.link} to={getLoginLink()}>
                        <IconArrow color="var(--accent-green)" className={classes.arrow}/>
                        Back to other options
                    </Link>
                </div>
            </main>
        </>
    );
}

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { CodeSnippet } from "../../library/CodeSnippet/CodeSnippet";
import { LogoCard } from "../../library/LogoCard/LogoCard";

import authClasses from "./Auth.module.css";
import classes from "./CliLoginSuccess.module.css";


export function CliLoginSuccess() {
    const [searchParams] = useSearchParams();

    const token = searchParams.get("token");
    // callback_uri is needed for older versions of the CLI
    // we can safely remove when all users are > 1.7.0
    const cliCallbackUri = searchParams.get("callback_uri");

    const queryEnabled = token !== null && cliCallbackUri !== null;

    const { isFetching, isError } = useQuery({
        queryKey: ["callback", cliCallbackUri, token],
        async queryFn() {
            const url = new URL(cliCallbackUri!);
            url.searchParams.append("token", token!);

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error("Failed to complete authentication");
            }

            return true;
        },
        retry: false,
        retryOnMount: false,
        refetchOnWindowFocus: false,
        enabled: queryEnabled,
        staleTime: Infinity,
    });

    if (isFetching) {
        return null;
    }

    const shouldShowToken = token && (!queryEnabled || isError);

    return (
        <>
            <header className={authClasses.header}/>
            <main className={authClasses.main}>
                <div className={authClasses.column}>
                    <LogoCard title="Login successful!">
                        {shouldShowToken ? (
                            <>
                                <p className={classes.content}>You can complete the authentication by copying the token and pasting it into the CLI.</p>
                                <CodeSnippet className={classes.token} code={token}/>
                            </>
                        ) : (
                            <p className={classes.content}>
                                You can now close this tab and head back to the terminal.
                            </p>
                        )}
                    </LogoCard>
                </div>
            </main>
        </>
    );
}

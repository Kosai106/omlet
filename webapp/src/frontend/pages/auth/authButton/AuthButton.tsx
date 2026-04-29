import classNames from "classnames";

import { LogoGithub } from "../../../library/logos/LogoGithub";
import { LogoGoogle } from "../../../library/logos/LogoGoogle";

import classes from "./AuthButton.module.css";

export enum AuthProvider {
    Github = "github",
    Google = "google",
}

interface Props {
    provider: AuthProvider;
    disabled?: boolean;
}

const providerName = {
    [AuthProvider.Github]: "GitHub",
    [AuthProvider.Google]: "Google",
};

const providerIcon = {
    [AuthProvider.Github]: LogoGithub,
    [AuthProvider.Google]: LogoGoogle,
};

const providerClasses = {
    [AuthProvider.Github]: classes.github,
    [AuthProvider.Google]: classes.google,
};

export function AuthButton({
    provider,
    disabled = false,
}: Props) {
    const Icon = providerIcon[provider];

    return (
        <button
            className={classNames(classes.authButton, providerClasses[provider])}
            type="submit"
            disabled={disabled}>
            <Icon/><span>{providerName[provider]}</span>
        </button>
    );
}

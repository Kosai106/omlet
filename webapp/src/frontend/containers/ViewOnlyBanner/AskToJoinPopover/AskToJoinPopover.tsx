import { type FormEvent, useState, useRef } from "react";

import { validate } from "email-validator";

import { APIError, APIErrorCode, createWorkspaceJoinRequest } from "../../../api/api";
import { Button } from "../../../library/Button/Button";
import { H3 } from "../../../library/Heading/Heading";
import { Popover, PopoverDirection } from "../../../library/Popover/Popover";
import { TextInput } from "../../../library/TextInput/TextInput";
import { logError } from "../../../logger";
import { type Workspace } from "../../../models/Workspace";

import classes from "./AskToJoinPopover.module.css";

interface Props {
    anchor: HTMLElement;
    workspace: Workspace;
    userEmail?: string;
    onSuccess(email: string): void;
    onClose(): void;
}

export function AskToJoinPopover({
    anchor,
    workspace,
    userEmail = "",
    onSuccess,
    onClose,
}: Props) {
    const [email, setEmail] = useState(userEmail);
    const [isEmailValid, setIsEmailValid] = useState(true);
    const [hasJoinRequestConflict, setHasJoinRequestConflict] = useState(false);
    const validationTimeoutRef = useRef<number>();

    function handleEmailInput(value: string) {
        setEmail(value);
        setHasJoinRequestConflict(false);

        window.clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = window.setTimeout(() => {
            const inputEmail = value.trim();
            setIsEmailValid(!inputEmail || validate(value.trim()));
        }, 500);
    }

    async function handleAskToJoinSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const inputEmail = email.trim();

        if (!validate(inputEmail)) {
            setIsEmailValid(false);
            return;
        }

        try {
            await createWorkspaceJoinRequest(workspace.slug, inputEmail);
            onSuccess(inputEmail);
        } catch (error) {
            if (
                error instanceof APIError &&
                (
                    error.code === APIErrorCode.JOIN_REQUEST_ALREADY_EXISTS ||
                    error.code === APIErrorCode.USER_ALREADY_MEMBER
                )
            ) {
                setHasJoinRequestConflict(true);
            } else {
                logError(error);
            }
        }
    }

    return (
        <Popover
            className={classes.askToJoinPopover}
            anchor={anchor}
            direction={PopoverDirection.Vertical}
            onClose={onClose}
            onCancel={onClose}>
            <div>
                <H3>Ask to join {workspace.name} workspace</H3>
                <p className={classes.p}>
                    To interact with these charts and access detailed component usage data, ask to join this workspace.
                    <br/><br/>
                    Share your email, we’ll let the workspace admins know:
                </p>
            </div>
            <form
                className={classes.emailForm}
                onSubmit={handleAskToJoinSubmit}>
                <TextInput
                    className={classes.emailInput}
                    placeholder="Type an email"
                    value={email}
                    autoSelect
                    onChange={handleEmailInput}/>
                <Button
                    type="submit"
                    disabled={!email.trim()}>
                    Ask to join
                </Button>
            </form>
            {!isEmailValid && <div className={classes.error}>Email doesn’t look right.</div>}
            {hasJoinRequestConflict && <div className={classes.info}>👀 We just sent you an email with instructions — please check your inbox!</div>}
        </Popover>
    );
}

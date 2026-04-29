import { type MouseEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { validate } from "email-validator";
import { generatePath, Link, useParams } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import { createEmailChangeRequest } from "../../../api/api";
import { Keyboard } from "../../../enums";
import { Button } from "../../../library/Button/Button";
import { HeaderButton } from "../../../library/HeaderButton/HeaderButton";
import { H3 } from "../../../library/Heading/Heading";
import { IconMenu } from "../../../library/icons/IconMenu";
import { Popover, PopoverDirection } from "../../../library/Popover/Popover";
import { TextInput } from "../../../library/TextInput/TextInput";
import { useToast } from "../../../library/Toast/Toast";
import { AccessLevel } from "../../../models/AccessLevel";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { HeaderMenu } from "../headerMenu/HeaderMenu";

import classes from "./MainHeaderButton.module.css";
import headerClasses from "../Header.module.css";

interface Props {
    showAllScans?: boolean;
    showRenameProjects?: boolean;
}

export function MainHeaderButton({
    showAllScans = false,
    showRenameProjects = false,
}: Props) {
    const headerButtonRef = useRef<HTMLButtonElement>(null);
    const toast = useToast();
    const [{ email, isHeaderMenuOpen, isEmailChangePopupOpen }, setState] = useState({
        email: "",
        isHeaderMenuOpen: false,
        isEmailChangePopupOpen: false,
    });
    const {
        selectors: {
            getUser,
            getWorkspace,
            getAccessLevel,
        },
        actions: {
            openRenameProjectsDialog,
        },
    } = useStore();
    const user = getUser();
    const workspace = getWorkspace();
    const accessLevel = getAccessLevel();
    const emailValid = useMemo(() => validate(email), [email]);

    const { workspaceSlug } = useParams();
    function handleButtonClick() {
        setState({
            email: "",
            isHeaderMenuOpen: true,
            isEmailChangePopupOpen: false,
        });
    }

    function handleOverlayClick() {
        setState({
            email: "",
            isHeaderMenuOpen: false,
            isEmailChangePopupOpen: false,
        });
    }

    function handleEmailChangeClick(event: MouseEvent<HTMLButtonElement>) {
        event.stopPropagation();
        setState({
            email: "",
            isHeaderMenuOpen: false,
            isEmailChangePopupOpen: true,
        });
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.Escape:
                event.preventDefault();
                setState({
                    email: "",
                    isHeaderMenuOpen: false,
                    isEmailChangePopupOpen: false,
                });
                break;
        }
    }

    function handleLogoutClick(event: MouseEvent<HTMLButtonElement>) {
        event.stopPropagation();
    }

    function handleMenuTextClick(event: MouseEvent<HTMLSpanElement>) {
        event.stopPropagation();
    }

    function handleEmailChangeCancel() {
        setState({
            email: "",
            isHeaderMenuOpen: false,
            isEmailChangePopupOpen: false,
        });
    }

    function handleEmailInput(value: string) {
        setState((prev) => ({
            ...prev,
            email: value.trim(),
        }));
    }

    async function handleEmailChangeSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        await createEmailChangeRequest(email);
        setState({
            email: "",
            isHeaderMenuOpen: false,
            isEmailChangePopupOpen: false,
        });
        toast.show("We sent you an email");
    }

    useEffect(() => {
        if (isHeaderMenuOpen || isEmailChangePopupOpen) {
            document.addEventListener("keydown", handleKeyDown);
        } else {
            document.removeEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isHeaderMenuOpen, isEmailChangePopupOpen]);

    return (
        <>
            <HeaderButton
                ref={headerButtonRef}
                active={isHeaderMenuOpen || isEmailChangePopupOpen}
                icon={<IconMenu/>}
                label={(workspace?.name ?? workspaceSlug) ?? ""}
                disabled={!user && accessLevel === AccessLevel.Page}
                onClick={handleButtonClick}/>
            <form id={headerClasses.form} className={headerClasses.form} method="post" action="/logout"/>
            {isHeaderMenuOpen && (
                <HeaderMenu
                    buttonRect={headerButtonRef.current!.getBoundingClientRect()}
                    onOverlayClick={handleOverlayClick}>
                    {workspace && showAllScans && (
                        <Link
                            to={generatePath(RoutePath.AllScans, { workspaceSlug: workspaceSlug! })}
                            state={{ fromApp: true }}>
                            All scans
                        </Link>
                    )}
                    {workspace && showRenameProjects && (
                        <button type="button" onClick={openRenameProjectsDialog}>
                            Rename projects
                        </button>
                    )}
                    {workspace && showAllScans && user && <hr/>}
                    {user && (
                        <>
                            <span onClick={handleMenuTextClick}>{user.email}</span>
                            <button type="button" onClick={handleEmailChangeClick}>
                                Change email
                            </button>
                            <button
                                type="submit"
                                form={headerClasses.form}
                                onClick={handleLogoutClick}>
                                Logout
                            </button>
                        </>
                    )}
                </HeaderMenu>
            )}
            {isEmailChangePopupOpen && (
                <Popover
                    className={classes.changeEmailPopover}
                    anchor={headerButtonRef.current!}
                    direction={PopoverDirection.Vertical}
                    offset={0}
                    onClose={handleEmailChangeCancel}
                    onCancel={handleEmailChangeCancel}>
                    <div className={classes.changeEmailPopoverContent}>
                        <div className={classes.text}>
                            <H3>Change email</H3>
                            <div className={classes.description}>
                                Type the email you want to move your account to
                            </div>
                        </div>
                        <form className={classes.form} onSubmit={handleEmailChangeSubmit}>
                            <TextInput className={classes.input} autoFocus placeholder="Type new email" onChange={handleEmailInput} value={email}/>
                            <Button type="submit" disabled={!emailValid || user?.email === email}>
                                Change
                            </Button>
                        </form>
                    </div>
                </Popover>
            )}
        </>
    );
}

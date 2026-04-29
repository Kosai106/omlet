import {
    type ClipboardEvent,
    type CSSProperties,
    type FormEvent,
    type MouseEvent,
    useEffect,
    useRef,
    useState,
    useMemo,
    useLayoutEffect,
} from "react";

import { createPortal } from "react-dom";
import { generatePath } from "react-router-dom";

import { RoutePath } from "../../../../common/RoutePath";
import { config } from "../../../../config/frontend";
import {
    acceptWorkspaceJoinRequest,
    denyWorkspaceJoinRequest,
    getInvites,
    getMembers,
    getWorkspaceInviteLinkCode,
    getWorkspaceJoinRequests,
    inviteUser,
    removeInvite,
    removeMember,
    resetWorkspaceInviteLinkCode,
} from "../../../api/api";
import { Keyboard } from "../../../enums";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { Button, ButtonKind } from "../../../library/Button/Button";
import { EggType } from "../../../library/Egg/Egg";
import { H3 } from "../../../library/Heading/Heading";
import { IconLink } from "../../../library/icons/IconLink";
import { useToast } from "../../../library/Toast/Toast";
import { logError } from "../../../logger";
import { type Invite } from "../../../models/Invite";
import { type WorkspaceJoinRequest } from "../../../models/WorkspaceJoinRequest";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { getPlainURL } from "../../../utils";

import { MemberRow, MemberType } from "./memberRow/MemberRow";

import classes from "./InviteDialog.module.css";

enum Direction {
    Vertical = "vertical",
    Horizontal = "horizontal",
}

interface Props {
    anchor: HTMLElement;
    direction?: Direction;
    hideCurrentUser?: boolean;
    hideInviteLink?: boolean;
    inviteToScan?: boolean;
    onJoinRequestCountChange?(count: number): void;
    onClose(): void;
}

const EGG_TYPES = [
    EggType.Easter_1,
    EggType.Easter_2,
    EggType.Easter_3,
    EggType.Easter_4,
    EggType.Easter_5,
    EggType.Easter_6,
    EggType.Easter_7,
    EggType.Easter_8,
    EggType.Easter_9,
];

export function InviteDialog({
    anchor,
    direction = Direction.Vertical,
    hideCurrentUser = false,
    hideInviteLink = false,
    inviteToScan = false,
    onJoinRequestCountChange,
    onClose,
}: Props) {
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const toast = useToast();

    const inviteDialogRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [position, setPosition] = useState<CSSProperties>(getPosition());

    const [disabled, setDisabled] = useState(true);
    const [inviteError, setInviteError] = useState("");
    const [inviteLinkCode, setInviteLinkCode] = useState("");
    const [joinRequests, setJoinRequests] = useState<WorkspaceJoinRequest[]>();
    const [invites, setInvites] = useState<Invite[]>();
    const { actions, selectors } = useStore();

    const members = selectors.getMembers();

    const memberEggMap = useMemo(() => {
        const membersWithoutAvatar = members?.filter(({ user: { avatarUrl } }) => !avatarUrl);
        return Object.fromEntries(membersWithoutAvatar?.map(({ user: { id } }, i) => [id, EGG_TYPES[i % EGG_TYPES.length]]) ?? []);
    }, [members]);

    const { selectors: { getUser, getWorkspace } } = useStore();
    const workspace = getWorkspace()!;
    const user = getUser()!;

    const inviteLink = useMemo(() => {
        if (!inviteLinkCode) {
            return "";
        }

        const path = generatePath(RoutePath.InviteLink, { workspaceSlug: workspace.slug, code: inviteLinkCode });

        return new URL(path, config.APP_BASE_URL).toString();
    }, [workspace.slug, inviteLinkCode]);

    function getPosition() {
        const buttonRect = anchor.getBoundingClientRect();
        const inviteDialogRect = inviteDialogRef.current?.getBoundingClientRect();
        const height = inviteDialogRect?.height ?? 0;
        const width = inviteDialogRect?.width ?? 0;

        let top;
        let left;
        if (direction === Direction.Vertical) {
            top = buttonRect.bottom ;
            if (top + height > windowHeight) {
                top = buttonRect.top - height;
            }

            left = buttonRect.left;
            if (left + width > windowWidth) {
                left = buttonRect.right - width;
            }
        } else {
            top = buttonRect.top;
            if (top + height > windowHeight) {
                top = buttonRect.bottom - height;
            }

            left = buttonRect.right;
            if (left + width > windowWidth) {
                left = buttonRect.left - width;
            }
        }

        return {
            top,
            left,
        };
    }

    function handleInput() {
        setInviteError("");

        const input = inputRef.current!;
        if (input.value === "" || !input.validity.valid) {
            setDisabled(true);
            return;
        }

        if (input.value === user.email) {
            setDisabled(true);
            setInviteError("😢 Feeling lonely?");
            input.select();
            return;
        }

        const existingMember = members?.find(({ user: { email } }) => email === input.value);
        if (existingMember) {
            setDisabled(true);
            setInviteError("☝️ Already a member");
            input.select();
            return;
        }

        const existingInvite = invites?.find(({ email }) => email === input.value);
        if (existingInvite) {
            setDisabled(true);
            setInviteError("☝️ Already invited");
            input.select();
            return;
        }

        setDisabled(false);
    }

    async function handleInvite(event: FormEvent) {
        event.preventDefault();

        const input = inputRef.current!;

        try {
            setDisabled(true);
            const response = await inviteUser(workspace.slug, input.value, inviteToScan);

            if (response.type === "invite") {
                setInvites(prev => [...(prev ?? []), response.data]);
            } else {
                actions.addMember({ user: response.data });
            }

            setJoinRequests(joinRequests => (joinRequests ?? [])!.filter(joinRequest => joinRequest.email !== response.data.email));

            input.select();
            input.value = "";
        } catch (error) {
            setDisabled(false);
            logError(error);
        }
    }

    function handleCopyURL(event: ClipboardEvent<HTMLSpanElement>) {
        event.preventDefault();

        event.clipboardData.setData("text/plain", inviteLink);

        toast.show("Link copied to clipboard!");
    }

    function handleCopyInviteLink() {
        window.navigator.clipboard.writeText(inviteLink);

        toast.show("Link copied to clipboard!");
    }

    async function handleResetInviteLink() {
        if (!inviteLinkCode) {
            return;
        }

        try {
            if (window.confirm("This will generate a new invite link and the previous link will no longer function.")) {
                const { code } = await resetWorkspaceInviteLinkCode(workspace.slug, inviteLinkCode);

                setInviteLinkCode(code);
            }
        } catch (error) {
            logError(error);
        }
    }

    async function handleJoinRequestAccept(joinRequestId: string) {
        try {
            const response = await acceptWorkspaceJoinRequest(workspace.slug, joinRequestId);

            if (response.type === "invite") {
                setInvites(invites => [...(invites ?? []), response.data]);
            } else {
                actions.addMember({ user: response.data });
            }

            setJoinRequests(joinRequests => joinRequests!.filter(joinRequest => joinRequest.id !== joinRequestId));
        } catch (error) {
            logError(error);
        }
    }

    async function handleJoinRequestDeny(joinRequestId: string) {
        try {
            await denyWorkspaceJoinRequest(workspace.slug, joinRequestId);

            setJoinRequests(joinRequests => joinRequests!.filter(joinRequest => joinRequest.id !== joinRequestId));
        } catch (error) {
            logError(error);
        }
    }

    async function handleRemoveInvite(inviteId: string) {
        try {
            const invite = invites!.find(invite => invite.id === inviteId)!;

            if (window.confirm(`Remove invite of ${invite.email} from workspace?`)) {
                await removeInvite(workspace.slug, inviteId);

                setInvites(invites => invites!.filter(invite => invite.id !== inviteId));
            }

        } catch (error) {
            logError(error);
        }
    }

    async function handleRemoveMember(userId: string) {
        try {
            const member = members?.find(member => member.user.id === userId);

            if (window.confirm(`Remove ${member?.user.email ?? "user"} from workspace?`)) {
                await removeMember(workspace.slug, userId);

                actions.removeMember(userId);
            }

        } catch (error) {
            logError(error);
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.code !== Keyboard.Code.Escape) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        onClose();
    }

    function handleBackdropClick(event: MouseEvent) {
        event.stopPropagation();
        onClose();
    }

    function handleDialogClick(event: MouseEvent) {
        event.stopPropagation();
    }

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useLayoutEffect(() => {
        if (!inviteDialogRef.current || !invites || !members) {
            return;
        }

        setPosition(getPosition());
    }, [inviteDialogRef.current, joinRequests, invites, members, windowWidth, windowHeight]);

    useEffect(() => {
        async function fetchJoinRequestAndInvites() {
            const [joinRequests, invitesResponse] = await Promise.all([
                getWorkspaceJoinRequests(workspace.slug),
                getInvites(workspace.slug),
            ]);

            setJoinRequests(joinRequests);
            setInvites(invitesResponse);
        }

        fetchJoinRequestAndInvites();
    }, [workspace.slug]);

    useEffect(() => {
        if (members !== null) {
            return;
        }
        async function fetchMembers() {
            actions.setMembers(await getMembers(workspace.slug));
        }
        fetchMembers();
    }, [workspace.slug, members]);

    useEffect(() => {
        async function fetchInviteLink() {
            const { code } = await getWorkspaceInviteLinkCode(workspace.slug);

            setInviteLinkCode(code);
        }

        if (!hideInviteLink) {
            fetchInviteLink();
        }
    }, [workspace.slug]);

    useEffect(() => {
        onJoinRequestCountChange?.(joinRequests?.length ?? 0);
    }, [joinRequests]);

    function renderDialog() {
        if (!joinRequests || !invites || !members) {
            return null;
        }

        return (
            <div
                ref={inviteDialogRef}
                className={classes.inviteDialog}
                style={position}
                onClick={handleDialogClick}>
                <div className={classes.inviteForm}>
                    <H3 className={classes.h3}>Invite by email</H3>
                    <p className={classes.p}>Type in an email to send an invite to</p>
                    <form className={classes.form} onSubmit={handleInvite}>
                        <input
                            ref={inputRef}
                            className={classes.input}
                            type="email"
                            placeholder="Type an email"
                            spellCheck={false}
                            autoFocus
                            onChange={handleInput}/>
                        <Button
                            className={classes.button}
                            type="submit"
                            disabled={disabled}>
                            Invite
                        </Button>
                    </form>
                    {inviteError && <p className={classes.error}>{inviteError}</p>}
                </div>
                {!hideInviteLink && inviteLink &&
                    <>
                        <hr className={classes.separator}/>
                        <div className={classes.inviteLink}>
                            <H3 className={classes.h3}>Copy invite link</H3>
                            <p className={classes.p}>Anyone using this link can join your workspace</p>
                            <div className={classes.inviteLinkActions}>
                                <span
                                    className={classes.inviteLinkURL}
                                    title={inviteLink}
                                    onClick={handleCopyInviteLink}
                                    onCopy={handleCopyURL}>
                                    {getPlainURL(inviteLink)}
                                </span>
                                <Button
                                    icon={<IconLink/>}
                                    onClick={handleCopyInviteLink}>
                                    Copy
                                </Button>
                                <Button
                                    kind={ButtonKind.Secondary}
                                    onClick={handleResetInviteLink}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </>
                }
                {(joinRequests.length !== 0 || invites.length !== 0 || members.length !== 0) && <hr className={classes.separator}/>}
                <div className={classes.members}>
                    {joinRequests.length !== 0 && (
                        <div className={classes.joinRequestsList}>
                            <H3 className={classes.h3}>
                                <span className={classes.countIndicator}>{joinRequests.length}</span>{" "}
                                Invite requests
                            </H3>
                            {joinRequests.map((joinRequest, i) => (
                                <MemberRow
                                    key={joinRequest.id}
                                    memberType={MemberType.JoinRequest}
                                    userId={joinRequest.id}
                                    email={joinRequest.email}
                                    eggType={EGG_TYPES[i % EGG_TYPES.length]}
                                    onAccept={handleJoinRequestAccept}
                                    onDeny={handleJoinRequestDeny}/>
                            ))}
                        </div>
                    )}
                    {joinRequests.length !== 0 && invites.length !== 0 && <hr className={classes.separator}/>}
                    {invites.length !== 0 && (
                        <div className={classes.invitesList}>
                            <H3 className={classes.h3}>Pending invites</H3>
                            {invites.map((invite, i) => (
                                <MemberRow
                                    key={invite.email}
                                    memberType={MemberType.Pending}
                                    userId={invite.id}
                                    email={invite.email}
                                    eggType={EGG_TYPES[i % EGG_TYPES.length]}
                                    onRemove={handleRemoveInvite}/>
                            ))}
                        </div>
                    )}
                    {(joinRequests.length !== 0 || invites.length !== 0) && members.length !== 0 && <hr className={classes.separator}/>}
                    {members.length !== 0 && (
                        <div className={classes.membersList}>
                            <H3 className={classes.h3}>Members</H3>
                            {members.map((member) => {
                                if (hideCurrentUser && member.user.id === user.id) {
                                    return null;
                                }

                                return (
                                    <MemberRow
                                        key={member.user.id}
                                        memberType={MemberType.Member}
                                        userId={member.user.id}
                                        email={member.user.email}
                                        avatarUrl={member.user.avatarUrl}
                                        eggType={member.user.avatarUrl ? undefined : memberEggMap[member.user.id]!}
                                        isSelf={user.id === member.user.id}
                                        isOwner={workspace.createdBy === user.id}
                                        onRemove={handleRemoveMember}/>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }


    return createPortal(
        <div className={classes.backdrop} onClick={handleBackdropClick}>
            {renderDialog()}
        </div>,
        document.body
    );
}

export {
    Direction as DialogDirection,
};

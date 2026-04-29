import { useRef, useState, type ReactNode } from "react";

import classNames from "classnames";

import { Button, ButtonKind } from "../../../../library/Button/Button";
import { ContextMenu, MenuAlignment, MenuItemKind } from "../../../../library/ContextMenu/ContextMenu";
import { type EggType, Egg } from "../../../../library/Egg/Egg";
import { IconMenu } from "../../../../library/icons/IconMenu";

import classes from "./MemberRow.module.css";

export enum MemberType {
    Pending = "pending",
    JoinRequest = "joinRequest",
    Member = "member",
}

interface BaseProps {
    userId: string;
    email: string;
    isSelf?: boolean;
    isOwner?: boolean;
    avatarUrl?: string;
    eggType?: EggType;
    actions?: ReactNode;
}

type Props = BaseProps & ({
    memberType: MemberType.Pending | MemberType.Member;
    onRemove(userId: string): void;
    onAccept?: never;
    onDeny?: never;
} | {
    memberType: MemberType.JoinRequest;
    onRemove?: never;
    onAccept(userId: string): void;
    onDeny(userId: string): void;
});

export function MemberRow({
    memberType,
    userId,
    email,
    isSelf = false,
    isOwner = false,
    avatarUrl,
    eggType,
    onRemove,
    onAccept,
    onDeny,
}: Props) {
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false);

    function renderActions() {
        if (!isOwner || isSelf) {
            return null;
        }

        switch (memberType) {
            case MemberType.Pending:
            case MemberType.Member: {
                const label = memberType === MemberType.Pending
                    ? "Remove invite"
                    : "Remove from workspace";

                return (
                    <>
                        <button
                            ref={menuButtonRef}
                            className={classNames(classes.menuButton, { [classes.menuOpen]: contextMenuOpen })}
                            onClick={() => setContextMenuOpen(true)}>
                            <IconMenu/>
                        </button>
                        {contextMenuOpen && (
                            <ContextMenu
                                anchorRect={menuButtonRef.current!.getBoundingClientRect()}
                                alignment={MenuAlignment.Right}
                                offsetY={-5}
                                onClose={() => setContextMenuOpen(false)}>
                                <ContextMenu.Button
                                    kind={MenuItemKind.Critical}
                                    onClick={() => onRemove?.(userId)}>
                                    {label}
                                </ContextMenu.Button>
                            </ContextMenu>
                        )}
                    </>
                );
            }

            case MemberType.JoinRequest: {
                return (
                    <>
                        <Button onClick={() => onAccept?.(userId)}>
                            Invite
                        </Button>
                        <Button
                            kind={ButtonKind.Secondary}
                            onClick={() => onDeny?.(userId)}>
                            Deny
                        </Button>
                    </>
                );
            }
        }
    }

    return (
        <div className={classes.member}>
            {avatarUrl
                ? <img className={classes.avatar} src={avatarUrl} alt={`${email}'s avatar`} referrerPolicy="no-referrer" crossOrigin="anonymous"/>
                : <Egg type={eggType!}/>
            }
            <div className={classes.content}>
                <div className={classes.email} title={email}>{email} {isSelf && "(you)"}</div>
            </div>
            {renderActions()}
        </div>
    );
}

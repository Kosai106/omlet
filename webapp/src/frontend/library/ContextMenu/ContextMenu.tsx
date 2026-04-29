import { useEffect, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent, type PropsWithChildren } from "react";

import classNames from "classnames";
import { createPortal } from "react-dom";
import { type LinkProps, Link } from "react-router-dom";

import { Keyboard } from "../../enums";

import classes from "./ContextMenu.module.css";

enum Alignment {
    Left = "left",
    Right = "right",
}

interface Props {
    anchorRect: DOMRect;
    alignment?: Alignment;
    offsetX?: number;
    offsetY?: number;
    onClose(): void;
}

export function ContextMenu({
    children,
    anchorRect,
    alignment = Alignment.Left,
    offsetX = 0,
    offsetY = 0,
    onClose,
}: PropsWithChildren<Props>) {
    function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
        event.stopPropagation();
        onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.Escape:
                event.preventDefault();
                event.stopPropagation();
                onClose();
                break;
        }
    }

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown, { capture: true });

        return () => {
            document.removeEventListener("keydown", handleKeyDown, { capture: true });
        };
    }, []);

    const top = anchorRect.bottom + offsetY;
    const style: CSSProperties = alignment === Alignment.Right
        ? { top, right: window.innerWidth - anchorRect.right - offsetX }
        : { top, left: anchorRect.left + offsetX };

    return createPortal(
        <div className={classes.menuOverlay} onClick={handleOverlayClick}>
            <div className={classes.menu} style={style}>
                {children}
            </div>
        </div>,
        document.body
    );
}

function Separator() {
    return (
        <hr className={classes.separator}/>
    );
}

export enum MenuItemKind {
    Default = "default",
    Critical = "critical",
}

interface MenuItemProps {
    kind?: MenuItemKind;
}

type ButtonMenuItemProps = MenuItemProps & ButtonHTMLAttributes<HTMLButtonElement>;

function ButtonMenuItem({
    type = "button",
    kind = MenuItemKind.Default,
    children,
    onClick,
}: ButtonMenuItemProps) {
    const clss = classNames(classes.item, classes.button, {
        [classes.critical]: kind === MenuItemKind.Critical,
    });

    return (
        <button
            className={clss}
            type={type}
            onClick={onClick}>
            {children}
        </button>
    );
}

type LinkMenuItemProps = MenuItemProps & LinkProps;

function LinkMenuItem({
    to,
    kind = MenuItemKind.Default,
    children,
    onClick,
}: LinkMenuItemProps) {
    const clss = classNames(classes.item, classes.link, {
        [classes.critical]: kind === MenuItemKind.Critical,
    });

    return (
        <Link
            className={clss}
            to={to}
            onClick={onClick}>
            {children}
        </Link>
    );
}

ContextMenu.Separator = Separator;
ContextMenu.Button = ButtonMenuItem;
ContextMenu.Link = LinkMenuItem;

export {
    Alignment as MenuAlignment,
};

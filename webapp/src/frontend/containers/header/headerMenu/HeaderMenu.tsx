import {
    type PropsWithChildren,
    type CSSProperties,
    type MouseEvent,
} from "react";

import { createPortal } from "react-dom";

import classes from "./HeaderMenu.module.css";

export enum Alignment {
    Left = "left",
    Right = "right",
}

interface MenuProps {
    buttonRect: DOMRect;
    alignment?: Alignment;
    offsetX?: number;
    offsetY?: number;
    onOverlayClick(): void;
}

export function HeaderMenu({
    children,
    buttonRect,
    alignment = Alignment.Left,
    offsetX = 0,
    offsetY = 0,
    onOverlayClick,
}: PropsWithChildren<MenuProps>) {
    function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
        event.stopPropagation();
        onOverlayClick();
    }

    const top = buttonRect.bottom + offsetY;
    const style: CSSProperties = alignment === Alignment.Right
        ? { top, right: window.innerWidth - buttonRect.right - offsetX }
        : { top, left: buttonRect.left + offsetX };

    return createPortal(
        <div className={classes.menuOverlay} onClick={handleOverlayClick}>
            <div className={classes.menu} style={style}>
                {children}
            </div>
        </div>,
        document.body
    );
}

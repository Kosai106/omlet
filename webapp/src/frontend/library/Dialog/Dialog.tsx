import { type ReactNode, type MouseEvent, useEffect } from "react";

import classNames from "classnames";
import { createPortal } from "react-dom";

import { Keyboard } from "../../enums";
import { IconCancelWithContainer } from "../icons/IconCancelWithContainer";

import classes from "./Dialog.module.css";

interface Props {
    className?: string;
    bodyClassName?: string;
    children: ReactNode;
    onClose(): void;
}

export function Dialog({
    className,
    bodyClassName,
    children,
    onClose,
}: Props) {
    function handleBackdropClick(event: MouseEvent) {
        event.stopPropagation();
        onClose();
    }

    function handleDialogClick(event: MouseEvent) {
        event.stopPropagation();
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.Escape:
                event.preventDefault();
                onClose();
                break;
        }
    }

    useEffect(() => {
        document.body.classList.add("noScroll");
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.classList.remove("noScroll");
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return createPortal(
        <div className={classes.backdrop} onClick={handleBackdropClick}>
            <div className={classNames(classes.dialog, className)} onClick={handleDialogClick}>
                <div className={classes.header}>
                    <button className={classes.closeButton} onClick={onClose}>
                        <IconCancelWithContainer className={classes.icon}/>
                    </button>
                </div>
                <div className={classNames(classes.body, bodyClassName)}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

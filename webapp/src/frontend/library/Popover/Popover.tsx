import {
    type CSSProperties,
    type MouseEvent,
    type PropsWithChildren,
    useEffect,
    useRef,
    useState,
    useLayoutEffect,
} from "react";

import classNames from "classnames";
import { createPortal } from "react-dom";

import { Keyboard } from "../../enums";
import { useWindowSize } from "../../hooks/useWindowSize";
import { toCSSValue } from "../../utils";

import classes from "./Popover.module.css";

export enum PopoverDirection {
    Vertical = "vertical",
    Horizontal = "horizontal",
    BottomLeft = "bottomLeft",
}

interface Props {
    className?: string;
    anchor: HTMLElement;
    direction: PopoverDirection;
    offset?: number;
    maxHeight?: number | string;
    onClose(): void;
    onCancel(): void;
}

export function Popover({
    className,
    anchor,
    direction,
    offset = 0,
    maxHeight,
    children,
    onClose,
    onCancel,
}: PropsWithChildren<Props>) {
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const popoverRef = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver>();
    const [position, setPosition] = useState<CSSProperties>(getPosition());

    function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
        event.stopPropagation();
        onClose();
    }

    function handlePopoverClick(event: MouseEvent<HTMLDivElement>) {
        event.stopPropagation();
    }

    function getPosition() {
        const anchorRect = anchor.getBoundingClientRect();
        const popoverRect = popoverRef.current?.getBoundingClientRect();
        const height = popoverRect?.height ?? 0;
        const width = popoverRect?.width ?? 0;
        let top = 0;
        let left = 0;
        if (direction === PopoverDirection.Vertical) {
            top = anchorRect.bottom + offset;
            if (top + height > windowHeight - offset) {
                top = anchorRect.top - height - offset;
            }

            if (top < 0) {
                top = anchorRect.bottom + offset;
            }

            left = anchorRect.left;
            if (left + width > windowWidth - offset) {
                left = windowWidth - width - offset;
            }
        } else if (direction === PopoverDirection.Horizontal) {
            top = anchorRect.top;
            if (top + height > windowHeight - offset) {
                top = windowHeight - height - offset;
            }

            left = anchorRect.right + offset;
            if (left + width > windowWidth - offset) {
                left = anchorRect.left - width - offset;
            }
        } else if (direction === PopoverDirection.BottomLeft) {
            top = anchorRect.bottom + offset;
            left = anchorRect.right - width;
        }

        return {
            top,
            left,
            "--top": toCSSValue(top),
        };
    }

    useLayoutEffect(() => {
        if (!popoverRef.current) {
            return;
        }

        setPosition(getPosition());
    }, [popoverRef.current, anchor, windowWidth, windowHeight]);

    useLayoutEffect(() => {
        if (popoverRef.current) {
            resizeObserverRef.current = new ResizeObserver(() => {
                setPosition(getPosition());
            });

            resizeObserverRef.current.observe(popoverRef.current);
        } else {
            resizeObserverRef.current?.disconnect();
        }

        return () => {
            resizeObserverRef.current?.disconnect();
        };
    }, [popoverRef.current]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            switch (event.code) {
                case Keyboard.Code.Escape:
                    event.preventDefault();
                    onCancel();
                    break;
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return createPortal(
        <div className={classes.popoverOverlay} onClick={handleOverlayClick}>
            <div
                ref={popoverRef}
                className={classNames(classes.popover, className)}
                style={{
                    ...position,
                    "--max-height": toCSSValue(maxHeight),
                }}
                onClick={handlePopoverClick}>
                {children}
            </div>
        </div>,
        document.body
    );
}

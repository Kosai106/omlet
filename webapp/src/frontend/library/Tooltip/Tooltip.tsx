import {
    type CSSProperties,
    type MouseEvent,
    type PropsWithChildren,
    type ReactNode,
    isValidElement,
    useEffect,
    useRef,
    useState,
    useLayoutEffect,
    Fragment,
} from "react";

import classNames from "classnames";
import { createPortal } from "react-dom";

import { useWindowSize } from "../../hooks/useWindowSize";

import classes from "./Tooltip.module.css";

export enum TooltipPlacement {
    TopLeft = "topLeft",
    Top = "top",
    TopRight = "topRight",
    RightTop = "rightTop",
    Right = "right",
    RightBottom = "rightBottom",
    BottomLeft = "bottomLeft",
    Bottom = "bottom",
    BottomRight = "bottomRight",
    LeftTop = "leftTop",
    Left = "left",
    LeftBottom = "leftBottom",
}

interface Props {
    placement?: TooltipPlacement;
    content?: ReactNode;
    contentType?: "default" | "path";
    delay?: number;
    followCursor?: boolean;
    className?: string;
    offset?: number;
}

const OFFSET = 4;
const EDGE_OFFSET = 16;

export function Tooltip({
    placement = TooltipPlacement.Top,
    content,
    contentType = "default",
    children,
    delay = 0,
    offset = OFFSET,
    followCursor = false,
    className,
}: PropsWithChildren<Props>) {
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [anchorRect, setAnchorRect] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
    const [position, setPosition] = useState<CSSProperties | null>(null);

    function handleMouseEnter(event: MouseEvent<HTMLDivElement>) {
        const target = event.target as HTMLElement;
        const tooltipContainer = target.closest(`.${classes.tooltipContainer}`)!;
        const targetRect = tooltipContainer.firstElementChild!.getBoundingClientRect();
        const x = followCursor ? event.clientX : targetRect.left;
        const y = followCursor ? event.clientY : targetRect.top;

        setAnchorRect({ x, y, width: targetRect.width, height: targetRect.height });
    }

    function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
        setAnchorRect(rect => ({ ...rect!, x: event.clientX, y: event.clientY }));
    }

    function handleMouseLeave() {
        setAnchorRect(null);
    }

    function handleScroll() {
        setAnchorRect(null);
    }

    function handleClick() {
        setAnchorRect(null);
    }

    useEffect(() => {
        if (tooltipRef.current) {
            document.addEventListener("click", handleClick, { capture: true });
            document.addEventListener("scroll", handleScroll, { passive: true, once: true });
        } else {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll);
        }

        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll);
        };
    }, [tooltipRef.current]);

    useEffect(() => {
        if (!content) {
            setAnchorRect(null);
        }
    }, [content]);

    useLayoutEffect(() => {
        if (!anchorRect) {
            return;
        }

        const position: CSSProperties = {};

        if (followCursor) {
            position.top = anchorRect.y - offset;
        } else if (placement.startsWith("top")) {
            position.top = anchorRect.y - offset;
        } else if (placement.startsWith("bottom")) {
            position.top = anchorRect.y + anchorRect.height + offset;
        } else if (placement.endsWith("Top")) {
            position.top = anchorRect.y;
        } else if (placement.endsWith("Bottom")) {
            position.top = anchorRect.y + anchorRect.height;
        } else {
            position.top = anchorRect.y + anchorRect.height / 2;
        }

        if (followCursor) {
            position.left = anchorRect.x;
        } else if (placement.startsWith("left")) {
            position.left = anchorRect.x - offset;
        } else if (placement.startsWith("right")) {
            position.left = anchorRect.x + anchorRect.width + offset;
        } else if (placement.endsWith("Left")) {
            position.left = anchorRect.x;
        } else if (placement.endsWith("Right")) {
            position.left = anchorRect.x + anchorRect.width;
        } else {
            position.left = anchorRect.x + anchorRect.width / 2;
        }

        setPosition(position);
    }, [anchorRect]);

    useLayoutEffect(() => {
        if (!tooltipRef.current || position === null) {
            return;
        }

        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const adjustedPosition: CSSProperties = {};

        if (placement.startsWith("top") || placement.startsWith("bottom")) {
            if (tooltipRect.left - EDGE_OFFSET < 0) {
                adjustedPosition.left = EDGE_OFFSET + tooltipRect.width / 2;
            } else if (tooltipRect.right + EDGE_OFFSET > windowWidth) {
                adjustedPosition.left = windowWidth - tooltipRect.width / 2 - EDGE_OFFSET;
            }
        }

        if (placement.startsWith("left") || placement.startsWith("right")) {
            if (tooltipRect.top - EDGE_OFFSET < 0) {
                adjustedPosition.top = EDGE_OFFSET + tooltipRect.height / 2;
            } else if (tooltipRect.bottom + EDGE_OFFSET > windowHeight) {
                adjustedPosition.top = windowHeight - tooltipRect.height / 2 - EDGE_OFFSET;
            }
        }

        setPosition(pos => ({
            ...pos,
            ...adjustedPosition,
        }));
    }, [tooltipRef.current, position === null]);

    const cls = classNames(
        classes.tooltip,
        {
            [classes.followCursor]: followCursor,
            [classes.topLeft]: placement === TooltipPlacement.TopLeft,
            [classes.top]: placement === TooltipPlacement.Top,
            [classes.topRight]: placement === TooltipPlacement.TopRight,
            [classes.rightTop]: placement === TooltipPlacement.RightTop,
            [classes.right]: placement === TooltipPlacement.Right,
            [classes.rightBottom]: placement === TooltipPlacement.RightBottom,
            [classes.bottomLeft]: placement === TooltipPlacement.BottomLeft,
            [classes.bottom]: placement === TooltipPlacement.Bottom,
            [classes.bottomRight]: placement === TooltipPlacement.BottomRight,
            [classes.leftTop]: placement === TooltipPlacement.LeftTop,
            [classes.left]: placement === TooltipPlacement.Left,
            [classes.leftBottom]: placement === TooltipPlacement.LeftBottom,
        },
        className,
    );

    function renderTooltip() {
        if (anchorRect === null || !content || position === null) {
            return null;
        }

        function renderContent() {
            if (contentType === "default") {
                return content;
            }

            const path = content as string;

            const pathParts = path.split("/");

            return (
                <>
                    {pathParts.map((pathPart, i) => (
                        <Fragment key={i}>
                            <span className={classes.pathPart}>{`${pathPart}${i === pathParts.length - 1 ? "" : "/"}`}</span>
                            <wbr/>
                        </Fragment>
                    ))}
                </>
            );
        }

        return createPortal(
            <div
                ref={tooltipRef}
                className={cls}
                style={{
                    animationDuration: `${delay}ms`,
                    ...position,
                }}>
                {renderContent()}
            </div>,
            document.body
        );
    }

    return (
        <span
            className={classes.tooltipContainer}
            onMouseEnter={handleMouseEnter}
            onMouseMove={followCursor && anchorRect ? handleMouseMove : undefined}
            onMouseLeave={anchorRect ? handleMouseLeave : undefined}>
            {isValidElement(children) ? children : <span>{children}</span>}
            {renderTooltip()}
        </span>
    );
}

export { type Props as TooltipProps };

import { type PropsWithChildren, type ReactNode, type UIEvent, useState, useRef, useEffect } from "react";

import classNames from "classnames";

import { H3 } from "../../library/Heading/Heading";

import classes from "./TreeContainer.module.css";

interface Props {
    header: ReactNode;
    withBackground?: boolean;
}

export function TreeContainer({ header, withBackground = true, children }: PropsWithChildren<Props>) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isTopShadowVisible, setIsTopShadowVisible] = useState(false);
    const [isBottomShadowVisible, setIsBottomShadowVisible] = useState(false);

    useEffect(() => {
        if (scrollAreaRef.current) {
            if (scrollAreaRef.current.scrollTop + scrollAreaRef.current.clientHeight < scrollAreaRef.current.scrollHeight) {
                setIsBottomShadowVisible(true);
            }
        }
    }, [scrollAreaRef.current]);

    function handleScroll(event: UIEvent<HTMLDivElement>) {
        if (event.currentTarget.scrollTop > 0 && !isTopShadowVisible) {
            setIsTopShadowVisible(true);
        } else if (event.currentTarget.scrollTop === 0 && isTopShadowVisible) {
            setIsTopShadowVisible(false);
        }

        const scrollBottom = event.currentTarget.scrollTop + event.currentTarget.clientHeight;
        if (scrollBottom >= event.currentTarget.scrollHeight && isBottomShadowVisible) {
            setIsBottomShadowVisible(false);
        } else if (scrollBottom < event.currentTarget.scrollHeight && !isBottomShadowVisible) {
            setIsBottomShadowVisible(true);
        }
    }

    const scrollAreaClassName = classNames(classes.scrollArea, {
        [classes.topShadow]: isTopShadowVisible,
        [classes.bottomShadow]: isBottomShadowVisible,
    });

    return (
        <div className={classNames(classes.treeContainer, { [classes.withBackground]: withBackground })}>
            <H3>{header}</H3>
            <div className={classes.viewContainer}>
                <div ref={scrollAreaRef} className={scrollAreaClassName} onScroll={handleScroll}>
                    {children}
                </div>
            </div>
        </div>
    );
}

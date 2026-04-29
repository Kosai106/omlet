import { useEffect, useRef } from "react";

import classNames from "classnames";

import { Keyboard } from "../../../enums";
import { IconCancel } from "../../../library/icons/IconCancel";

import classes from "./YoutubePlayer.module.css";

enum Type {
    Compact = "compact",
    FullPage = "fullPage",
}

interface Props {
    videoId: string;
    type?: Type;
    onClose(): void;
}

export function YoutubePlayer({
    videoId,
    type = Type.Compact,
    onClose,
}: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const slideInAnimationRef = useRef<Animation>();

    const width = type === Type.Compact ? "480" : "960";
    const height = type === Type.Compact ? "270" : "540";

    function handleClose() {
        const fadeOutAnimation = overlayRef.current!.animate([
            { opacity: "0" },
        ], {
            duration: 200,
            easing: "ease-in-out",
            fill: "forwards",
        });

        fadeOutAnimation.addEventListener("finish", () => {
            onClose();
        });
    }

    useEffect(() => {
        if (!window.youtubeLoaded) {
            window.youtubeLoaded = new Promise<void>(resolve => {
                const youtubeAPIScript = document.createElement("script");
                youtubeAPIScript.src = "https://www.youtube.com/iframe_api";
                youtubeAPIScript.id = "youtubeAPIScript";
                document.head.appendChild(youtubeAPIScript);

                window.onYouTubeIframeAPIReady = () => resolve();
            });
        }
    }, []);

    useEffect(() => {
        if (!window.youtubeLoaded || !playerRef.current || !iframeRef.current) {
            return;
        }

        async function initializeYoutubePlayer() {
            await window.youtubeLoaded;

            new window.YT.Player(iframeRef.current!, {
                events: {
                    onReady() {
                        if (type === Type.Compact && !slideInAnimationRef.current) {
                            slideInAnimationRef.current = playerRef.current!.animate([
                                { transform: "translateX(0)" },
                            ], {
                                duration: 400,
                                easing: "cubic-bezier(00.25, 0.1, 0.25, 1)",
                                fill: "forwards",
                            });
                        }
                    },
                },
            });
        }

        initializeYoutubePlayer();
    }, [window.youtubeLoaded, playerRef.current, iframeRef.current]);

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case Keyboard.Code.Escape:
                event.preventDefault();
                event.stopPropagation();
                handleClose();
                break;
        }
    }

    useEffect(() => {
        if (overlayRef.current) {
            document.addEventListener("keydown", handleKeyDown);
        } else {
            document.removeEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [overlayRef.current]);

    return (
        <div
            ref={overlayRef}
            className={classNames(classes.youtubePlayerOverlay, {
                [classes.compact]: type === Type.Compact,
                [classes.fullPage]: type === Type.FullPage,
            })}
            onClick={handleClose}>
            <div
                ref={playerRef}
                className={classes.youtubePlayer}>
                <button
                    className={classes.closeButton}
                    type="button"
                    onClick={handleClose}>
                    <IconCancel/>
                </button>
                <iframe
                    ref={iframeRef}
                    width={width}
                    height={height}
                    src={`https://www.youtube.com/embed/${videoId}?origin=${window.origin}&enablejsapi=1&playsinline=1&autoplay=1&fs=0&cc_load_policy=1&rel=0`}
                    allow="autoplay">
                </iframe>
            </div>
        </div>
    );
}

export {
    Type as PlayerType,
};

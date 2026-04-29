import { type PropsWithChildren, type ReactNode, createContext, useContext, useState, useCallback } from "react";

import classes from "./Toast.module.css";

const DEFAULT_DISPLAY_DURATION = 3000;
const ANIMATION_DURATION = 150;

type ToastShowFunction = (content: ReactNode, duration?: number) => void;
type ToastHideFunction = () => void;
type ToastFunctions = { show: ToastShowFunction; hide: ToastHideFunction; };
const ToastContext = createContext<ToastFunctions>({ show: () => {}, hide: () => {} });

export function useToast(): ToastFunctions {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: PropsWithChildren<{ }>) {
    const [content, setContent] = useState<ReactNode>(null);
    const [displayDuration, setDisplayDuration] = useState<number>(DEFAULT_DISPLAY_DURATION);

    const toastRef = useCallback(async (node: HTMLDivElement) => {
        if (node === null) {
            return;
        }

        const keyframes = [{
            transform: "translate(-50%, 100%)",
        }, {
            transform: "translate(-50%, calc(-1 * var(--spacing-m)))",
        }];

        const options: KeyframeAnimationOptions = {
            duration: ANIMATION_DURATION,
            easing: "ease-out",
            fill: "forwards",
        };

        await node.animate(keyframes, options).finished;

        if (!Number.isFinite(displayDuration)) {
            return;
        }

        await node.animate(keyframes, {
            ...options,
            delay: displayDuration,
            direction: "reverse",
        }).finished;

        hide();
    }, [displayDuration]);

    function show(next: ReactNode, duration = DEFAULT_DISPLAY_DURATION) {
        setDisplayDuration(duration);
        setContent(next);
    }

    function hide() {
        setContent(null);
        setDisplayDuration(DEFAULT_DISPLAY_DURATION);
    }

    return (
        <ToastContext.Provider value={{ show, hide }}>
            {children}
            {content && (
                <div
                    ref={toastRef}
                    className={classes.toast}>
                    {content}
                </div>
            )}
        </ToastContext.Provider>
    );
}

import { type PropsWithChildren, createContext, useContext, useEffect, useRef, useState } from "react";

const WindowSizeContext = createContext<{ width: number; height: number; }>({ width: 0, height: 0 });

export function WindowSizeProvider({ children }: PropsWithChildren<{}>) {
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const debounceTimeout = useRef<number>();

    useEffect(() => {
        function calculateWindowWidth() {
            window.clearTimeout(debounceTimeout.current);
            if (windowSize.width !== window.innerWidth || windowSize.height !== window.innerHeight) {
                debounceTimeout.current = window.setTimeout(
                    setWindowSize,
                    100,
                    {
                        width: window.innerWidth,
                        height: window.innerHeight,
                    }
                );
            }
        }

        calculateWindowWidth();
        window.addEventListener("resize", calculateWindowWidth);

        return () => {
            window.removeEventListener("resize", calculateWindowWidth);
        };
    }, []);

    return (
        <WindowSizeContext.Provider value={windowSize}>
            {children}
        </WindowSizeContext.Provider>
    );
}

export function useWindowSize() {
    return useContext(WindowSizeContext);
}

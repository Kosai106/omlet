import { type PropsWithChildren, useEffect, useRef } from "react";

interface Props {
    className: string;
    hasNext: boolean;
    scrollOffset?: number;
    onEnd: () => void;
}

export function InfiniteScroll({
    className,
    hasNext,
    scrollOffset = 320,
    children,
    onEnd,
}: PropsWithChildren<Props>) {
    const anchorRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!anchorRef.current || !scrollContainerRef.current || !hasNext) {
            return;
        }
        const intersectionObserver = new IntersectionObserver(entries => {
            const isIntersecting = entries.some(({ isIntersecting }) => isIntersecting);
            if (isIntersecting) {
                onEnd();
            }
        }, {
            root: scrollContainerRef.current,
            rootMargin: `0px 0px ${scrollOffset}px 0px`,
        });

        intersectionObserver.observe(anchorRef.current);

        return () => {
            intersectionObserver.disconnect();
        };
    }, [anchorRef.current, scrollContainerRef.current, hasNext]);
    return (
        <div className={className} ref={scrollContainerRef}>
            {children}
            {hasNext && <div ref={anchorRef}/>}
        </div>
    );
}

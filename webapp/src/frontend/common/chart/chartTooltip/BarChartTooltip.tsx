import { useLayoutEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { type Tag as TagModel } from "../../../../common/models/Tag";

import { type ChartTooltipProps, ChartTooltip, TOOLTIP_OFFSET } from "./ChartTooltip";
import { ChartTooltipSide } from "./ChartTooltipSide";

type Props = Omit<ChartTooltipProps, "side"> & {
    tags: string[];
    tagMap: Record<string, TagModel>;
};

export function BarChartTooltip({
    x,
    y,
    ...props
}: Props) {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x, y, side: ChartTooltipSide.Top });

    function positionTooltip() {
        if (!tooltipRef.current) {
            return;
        }

        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        let newX = x;
        if (newX + tooltipRect.width / 2 > window.innerWidth - TOOLTIP_OFFSET) {
            newX = window.innerWidth - tooltipRect.width / 2 - TOOLTIP_OFFSET;
        }

        const newY = y;
        let newSide = ChartTooltipSide.Top;
        if (newY - tooltipRect.height < 2 * TOOLTIP_OFFSET) {
            newSide = ChartTooltipSide.Bottom;
        }

        setTooltipPosition({ x: newX, y: newY, side: newSide });
    }

    useLayoutEffect(() => {
        positionTooltip();
    }, [tooltipRef.current, x, y]);

    return createPortal(
        <ChartTooltip
            ref={tooltipRef}
            x={tooltipPosition.x}
            y={tooltipPosition.y}
            side={tooltipPosition.side}
            {...props}/>,
        document.body
    );
}

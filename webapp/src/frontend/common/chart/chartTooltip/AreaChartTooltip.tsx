import { type ChartTooltipProps, ChartTooltip } from "./ChartTooltip";
import { type ChartTooltipSide } from "./ChartTooltipSide";

export type AreaChartTooltipProps = Omit<ChartTooltipProps, "tags" | "tagMap"> & {
    side: ChartTooltipSide.Top | ChartTooltipSide.Bottom;
};

export function AreaChartTooltip(props: AreaChartTooltipProps) {
    return (
        <foreignObject width="100%" height="100%" overflow="visible" pointerEvents="none">
            <ChartTooltip {...props}/>
        </foreignObject>
    );
}

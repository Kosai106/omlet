import classNames from "classnames";

import { Tooltip } from "../../../library/Tooltip/Tooltip";

import { type LegendItem as LegendItemModel } from "./LegendItem";

import classes from "./Legend.module.css";

interface LegendItemProps {
    item: LegendItemModel;
}

function LegendItem({
    item: {
        name,
        color,
        tooltip,
    },
}: LegendItemProps) {
    return (
        <Tooltip content={tooltip}>
            <div className={classes.legendItem}>
                <div
                    className={classes.legendItemIndicator}
                    style={{ backgroundColor: color }}/>
                <div className={classes.legendItemLabel}>{name}</div>
            </div>
        </Tooltip>
    );
}

interface Props {
    className?: string;
    items: LegendItemModel[];
}

export function Legend({ className, items }: Props) {
    return (
        <div className={classNames(classes.legend, className)}>
            {items.map(item => <LegendItem key={item.id} item={item}/>)}
        </div>
    );
}

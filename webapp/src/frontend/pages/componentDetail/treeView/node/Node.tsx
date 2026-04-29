import { useMemo, useState } from "react";

import classNames from "classnames";
import { Link } from "react-router-dom";
import { type NodeProps, Handle, NodeToolbar, Position } from "reactflow";

import { RESERVED_TAGS } from "../../../../../common/models/Tag";
import { TruncateFromMiddle } from "../../../../common/truncate/TruncateFromMiddle";
import { Tag } from "../../../../library/Tag/Tag";
import { useStore } from "../../../../providers/StoreProvider/StoreProvider";
import { type ComponentWithDependencyTreeData } from "../TreeView";

import classes from "./Node.module.css";

interface NodeContentProps {
    component: ComponentWithDependencyTreeData;
    tagColor: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}
function NodeContent({
    component: {
        definitionId,
        name,
        highlighted,
        selected,
        level,
    },
    tagColor,
    onMouseEnter,
    onMouseLeave,
}: NodeContentProps) {
    const content = (
        <>
            <span className={classes.inner}>
                {name}
            </span>
            <div className={classes.tagIndicator} style={{ backgroundColor: tagColor }} />
        </>
    );

    if (level === 0) {
        return (
            <div
                className={classNames(classes.node, classes.main)}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}>
                {content}
            </div>
        );
    }

    return (
        <Link
            to={`../${encodeURIComponent(`${name}::${definitionId}`)}/dependency-tree`}
            className={classNames(
                classes.node,
                {
                    [classes.highlighted]: !selected && highlighted,
                    [classes.selected]: selected,
                },
            )}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}>
            {content}
        </Link>
    );
}

export function Node({ data }: NodeProps<ComponentWithDependencyTreeData>) {
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const { selectors: { getTags } } = useStore();
    const { name, packageName, tags: tagSlugs } = data;
    const tags = useMemo(() => getTags().filter(tag => tagSlugs.includes(tag.slug)), [tagSlugs]);
    const tagColor = tags[0]?.color ?? RESERVED_TAGS.UNTAGGED.color;

    function handleMouseEnter() {
        setTooltipOpen(true);
    }

    function handleMouseLeave() {
        setTooltipOpen(false);
    }

    return (
        <>
            <Handle type="target" position={Position.Left} className={classes.leftHandle}/>
            <NodeContent component={data} tagColor={tagColor} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}/>
            <NodeToolbar
                position={Position.Top}
                className={classes.nodeTooltip}
                isVisible={tooltipOpen}
                style={{ borderLeftColor: tagColor }}>
                <div className={classes.main}>
                    <span className={classes.name}>{name}</span>
                    <TruncateFromMiddle className={classes.packageName} text={packageName} width={284} />
                </div>
                <div className={classes.tags}>
                    {tags.map(tag => <Tag key={tag.slug} tag={tag} />)}
                </div>
            </NodeToolbar>
            <Handle type="source" position={Position.Right} className={classes.rightHandle}/>
        </>
    );
}

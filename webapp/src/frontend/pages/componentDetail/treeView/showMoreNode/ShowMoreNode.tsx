import { type NodeProps, Handle, Position } from "reactflow";

import classes from "./ShowMoreNode.module.css";

interface Props {
    level: number;
    nodeCount: number;
    onClick: () => void;
}

export function ShowMoreNode({ data }: NodeProps<Props>) {
    const { nodeCount, onClick } = data;

    return (
        <>
            <Handle type="target" position={Position.Left} className={classes.leftHandle}/>
            <div className={classes.showMoreNode} onClick={onClick}>
                {nodeCount} more…
            </div>
            <Handle type="source" position={Position.Right} className={classes.rightHandle}/>
        </>
    );
}

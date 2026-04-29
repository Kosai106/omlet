import { type TreeNode } from "../../../../common/models/TreeNode";
import { type Folder } from "../../../models/Folder";
import { findDescendantCount, LINE_SIZE, NODE_SIZE } from "../../../treeUtils";

import classes from "./VerticalLine.module.css";

interface Props {
    packageName: string;
    folder: Folder;
    collapsedNodes: TreeNode[];
}

export function VerticalLine({
    packageName,
    folder,
    collapsedNodes,
}: Props) {
    // Ignore the last child since there is no line for it
    const lineCount = findDescendantCount(packageName, folder.path, folder.children.slice(0, -1), collapsedNodes);

    return (
        <div
            className={classes.verticalLine}
            style={{ height: lineCount * NODE_SIZE + LINE_SIZE }}/>
    );
}

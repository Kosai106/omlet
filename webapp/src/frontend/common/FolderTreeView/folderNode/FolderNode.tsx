import classNames from "classnames";

import { type FolderFilter } from "../../../../common/models/FolderFilter";
import { TreeNode } from "../../../../common/models/TreeNode";
import { pluralize } from "../../../../common/utils";
import { TruncateFromMiddle } from "../../../common/truncate/TruncateFromMiddle";
import { IconBranch } from "../../../library/icons/IconBranch";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { Tooltip } from "../../../library/Tooltip/Tooltip";
import { type Folder } from "../../../models/Folder";
import { findDescendantCount, LINE_SIZE, NODE_SIZE } from "../../../treeUtils";

import classes from "./FolderNode.module.css";

interface Props {
    folder: Folder;
    packageName: string;
    level: number;
    collapsedTreeNodes: TreeNode[];
    folders: FolderFilter;
    onCollapse(node: TreeNode): void;
    onSelectionChange(node: TreeNode, isSelected: boolean): void;
}

export function FolderNode({
    folder,
    packageName,
    level,
    collapsedTreeNodes,
    folders,
    onCollapse,
    onSelectionChange,
}: Props) {
    const currentNode = new TreeNode({ packageName, path: folder.path });
    const collapsed = collapsedTreeNodes.some(collapsedNode => collapsedNode.equals(currentNode));
    const selected = currentNode.isSelected(folders);
    const isAnyChildSelected = folders.selectedTreeNodes.some(selectedNode => selectedNode.startsWith(currentNode));
    const partiallySelected = folders.deselectedTreeNodes.some(deselectedNode => deselectedNode.startsWith(currentNode));

    function renderLines() {
        if (folder.children.length === 0 || collapsed) {
            return null;
        }

        const lines = [];
        let previousHeight = 0;
        for (const child of folder.children) {
            const childNode = new TreeNode({ packageName, path: child.path });
            const folderSelected = childNode.isSelected(folders);
            const isAnyChildSelected = folders.selectedTreeNodes.some(selectedNode => selectedNode.startsWith(childNode));

            lines.push(
                <div
                    key={`line-${packageName}-${child.path}`}
                    className={classNames(classes.verticalLine, { [classes.selected]: folderSelected || isAnyChildSelected })}
                    style={{ height: previousHeight + LINE_SIZE }}/>
            );

            // Count itself and its descendants
            const nodeCount = 1 + findDescendantCount(packageName, child.path, child.children, collapsedTreeNodes);
            previousHeight += nodeCount * NODE_SIZE;
        }

        return lines;
    }

    function renderChildren() {
        if (folder.children.length === 0 || collapsed) {
            return null;
        }

        return folder.children.map(child =>
            <FolderNode
                key={`folderNode-${packageName}-${child.path}`}
                folder={child}
                packageName={packageName}
                level={level + 1}
                collapsedTreeNodes={collapsedTreeNodes}
                folders={folders}
                onCollapse={onCollapse}
                onSelectionChange={onSelectionChange}/>
        );
    }

    const labelClass = classNames(classes.folderSelector, {
        [classes.selected]: selected,
        [classes.partiallySelected]: partiallySelected,
        [classes.leaf]: folder.children.length === 0,
    });

    return (
        <div className={classes.folderNode}>
            {renderLines()}
            <div className={classes.current}>
                <IconBranch
                    className={classes.branchIcon}
                    color={selected || isAnyChildSelected ? "var(--accent-green)" : "var(--button-background-disabled-color)"}/>
                {folder.children.length !== 0 && (
                    <button
                        type="button"
                        className={classNames(classes.collapseButton, { [classes.collapsed]: collapsed })}
                        onClick={() => onCollapse(currentNode)}>
                        <IconChevronDown color={selected || isAnyChildSelected ? "var(--accent-green)" : undefined}/>
                    </button>
                )}
                <label className={labelClass} tabIndex={0}>
                    <TruncateFromMiddle
                        className={classes.folderInfo}
                        text={folder.name}
                        tooltipProps={{ contentType: "path" }}/>
                    <span className={classes.separatorDot}/>
                    <Tooltip content={pluralize("component", folder.totalNumberOfComponents)}>
                        <span className={classes.componentCount}>
                            {folder.totalNumberOfComponents}
                        </span>
                    </Tooltip>
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={event => onSelectionChange(currentNode, event.currentTarget.checked)}/>
                </label>
            </div>
            {renderChildren()}
        </div>
    );
}

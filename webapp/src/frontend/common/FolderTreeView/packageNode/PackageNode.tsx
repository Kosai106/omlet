import classNames from "classnames";

import { type FolderFilter } from "../../../../common/models/FolderFilter";
import { TreeNode } from "../../../../common/models/TreeNode";
import { pluralize } from "../../../../common/utils";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconFolder } from "../../../library/icons/IconFolder";
import { Tooltip } from "../../../library/Tooltip/Tooltip";
import { type Package } from "../../../models/Package";
import { findDescendantCount, LINE_SIZE, NODE_SIZE } from "../../../treeUtils";
import { TruncateFromMiddle } from "../../truncate/TruncateFromMiddle";
import { FolderNode } from "../folderNode/FolderNode";

import classes from "./PackageNode.module.css";

interface Props extends Package {
    collapsedTreeNodes: TreeNode[];
    folders: FolderFilter;
    onCollapse(node: TreeNode): void;
    onSelectionChange(node: TreeNode, isSelected: boolean): void;
}

export function PackageNode({
    name,
    totalNumberOfComponents,
    children,
    collapsedTreeNodes,
    folders,
    onCollapse,
    onSelectionChange,
}: Props) {
    const currentNode = new TreeNode({ packageName: name, path: "" });
    const collapsed = collapsedTreeNodes.some(collapsedNode => collapsedNode.equals(currentNode));
    const selected = currentNode.isSelected(folders);
    const partiallySelected = folders.deselectedTreeNodes.some(deselectedNode => deselectedNode.startsWith(currentNode));

    function renderLines() {
        if (children.length === 0 || collapsed) {
            return null;
        }

        const lines = [];
        let previousHeight = 0;
        for (const folder of children) {
            const childNode = new TreeNode({ packageName: name, path: folder.path });
            const folderSelected = childNode.isSelected(folders);
            const isAnyChildSelected = folders.selectedTreeNodes.some(selectedNode => selectedNode.startsWith(childNode));

            lines.push(
                <div
                    key={`line-${name}-${folder.path}`}
                    className={classNames(classes.verticalLine, { [classes.selected]: folderSelected || isAnyChildSelected })}
                    style={{ height: previousHeight + LINE_SIZE }}/>
            );

            // Count itself and its descendants
            const nodeCount = 1 + findDescendantCount(name, folder.path, folder.children, collapsedTreeNodes);
            previousHeight += nodeCount * NODE_SIZE;
        }

        return lines;
    }

    function renderFolders() {
        if (collapsed) {
            return null;
        }

        return (
            <div className={classes.folders}>
                {children.map(folder =>
                    <FolderNode
                        key={`folderNode-${name}-${folder.path}`}
                        folder={folder}
                        packageName={name}
                        level={0}
                        collapsedTreeNodes={collapsedTreeNodes}
                        folders={folders}
                        onCollapse={onCollapse}
                        onSelectionChange={onSelectionChange}/>
                )}
            </div>
        );
    }

    const labelClass = classNames(classes.packageSelector, {
        [classes.selected]: selected,
        [classes.partiallySelected]: partiallySelected,
        [classes.leaf]: children.length === 0,
    });

    return (
        <div className={classes.packageNode}>
            <div className={classNames(classes.packageLine, { [classes.selected]: selected })}/>
            {renderLines()}
            <div className={classes.packageInfo}>
                <button
                    type="button"
                    className={classNames(classes.collapseButton, { [classes.collapsed]: collapsed })}
                    onClick={() => onCollapse(currentNode)}>
                    <IconChevronDown/>
                </button>
                <IconFolder/>
                <label className={labelClass} tabIndex={0}>
                    <TruncateFromMiddle className={classes.packageName} text={name} />
                    <span className={classes.separatorDot}/>
                    <Tooltip content={pluralize("component", totalNumberOfComponents)}>
                        <span className={classes.componentCount}>
                            {totalNumberOfComponents}
                        </span>
                    </Tooltip>
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={event => onSelectionChange(currentNode, event.currentTarget.checked)}/>
                </label>
            </div>
            {renderFolders()}
        </div>
    );
}

import { useEffect, useState } from "react";

import { type FolderFilter } from "../../../common/models/FolderFilter";
import { type TreeNode } from "../../../common/models/TreeNode";
import { type Package } from "../../models/Package";
import { findChildTreeNodes, getChildrenTreeNodes } from "../../treeUtils";

import { PackageNode } from "./packageNode/PackageNode";

import classes from "./FolderTreeView.module.css";

interface Props {
    packages: Package[];
    folders: FolderFilter;
    onSelectionChange(node: TreeNode, isSelected: boolean): void;
}

export function FolderTreeView({
    packages,
    folders,
    onSelectionChange,
}: Props) {
    const [collapsedNodes, setCollapsedNodes] = useState<TreeNode[]>(() => packages.flatMap(pckg => getChildrenTreeNodes(pckg, pckg.name)));

    function handleCollapse(node: TreeNode) {
        setCollapsedNodes(nodes => {
            let newCollapsedNodes = [...nodes];
            const index = newCollapsedNodes.findIndex(n => n.equals(node));

            if (index >= 0) {
                newCollapsedNodes.splice(index, 1);

                const childTreeNodes = findChildTreeNodes(packages, node);
                newCollapsedNodes.push(...childTreeNodes);
            } else {
                newCollapsedNodes = newCollapsedNodes.filter(treeNode =>
                    treeNode.packageName !== node.packageName || !treeNode.path.startsWith(node.path)
                );

                newCollapsedNodes.push(node);
            }

            return newCollapsedNodes;
        });
    }

    useEffect(() => {
        const initialCollapsedNodes = packages.flatMap(pckg => getChildrenTreeNodes(pckg, pckg.name));

        setCollapsedNodes(initialCollapsedNodes);
    }, [packages]);

    return (
        <div className={classes.folderTreeView}>
            {packages.map(pckg =>
                <PackageNode
                    {...pckg}
                    key={pckg.name}
                    collapsedTreeNodes={collapsedNodes}
                    folders={folders}
                    onCollapse={handleCollapse}
                    onSelectionChange={onSelectionChange}/>
            )}
        </div>
    );
}

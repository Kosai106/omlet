import { useEffect, useState } from "react";

import { type Tag, RESERVED_TAGS } from "../../../common/models/Tag";
import { type TreeNode } from "../../../common/models/TreeNode";
import { createWorkspaceTag, getWorkspace as getWorkspaceBySlug, updateWorkspaceTag } from "../../api/api";
import { logError } from "../../logger";
import { type Package } from "../../models/Package";
import { useStore } from "../../providers/StoreProvider/StoreProvider";
import { findChildTreeNodes, getChildrenTreeNodes } from "../../treeUtils";

import { PackageNode } from "./packageNode/PackageNode";

import classes from "./TagManagementTree.module.css";

interface Props {
    packages: Package[];
    readOnly?: boolean;
}

export function TagManagementTree({
    packages,
    readOnly = false,
}:Props) {
    const [collapsedNodes, setCollapsedNodes] = useState<TreeNode[]>(() => packages.flatMap(pckg => getChildrenTreeNodes(pckg, pckg.name)));

    const {
        actions: { setWorkspace },
        selectors: { getWorkspace },
    } = useStore();

    const workspace = getWorkspace()!;
    const userTags = workspace.tags.filter(({ slug }) => ![RESERVED_TAGS.EXTERNAL.slug].includes(slug));

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

    async function fetchWorkspace() {
        try {
            const { workspace: updatedWorkspace, accessLevel } = await getWorkspaceBySlug(workspace.slug);

            setWorkspace(updatedWorkspace, accessLevel);
        } catch (error) {
            logError(error);
        }
    }

    async function handleTagSet(tag: Tag, node?: TreeNode) {
        try {
            const selectedTreeNodes = node ? [node] : [];
            await createWorkspaceTag(workspace.slug, { name: tag.name, selectedTreeNodes });
            await fetchWorkspace();
        } catch (error) {
            logError(error);
        }
    }

    async function handleTagAdd(tag: Tag, node: TreeNode) {
        const userTag = userTags.find(({ slug }) => slug === tag.slug);
        if (!userTag) {
            return handleTagSet(tag, node);
        }

        try {
            let { selectedTreeNodes, deselectedTreeNodes } = tag;
            selectedTreeNodes = selectedTreeNodes.filter(selectedNode => !selectedNode.startsWith(node));
            if (!deselectedTreeNodes.some(deselectedNode => deselectedNode.equals(node))) {
                selectedTreeNodes.push(node);
            }
            deselectedTreeNodes = deselectedTreeNodes.filter(deselectedNode => !deselectedNode.startsWith(node));

            await updateWorkspaceTag(workspace.slug, tag.slug, {
                selectedTreeNodes,
                deselectedTreeNodes,
            });
            await fetchWorkspace();
        } catch (error) {
            logError(error);
        }
    }

    async function handleTagRemove(tag: Tag, node: TreeNode) {
        try {
            let { selectedTreeNodes, deselectedTreeNodes } = tag;
            deselectedTreeNodes = deselectedTreeNodes.filter(deselectedNode => !deselectedNode.startsWith(node));
            if (!selectedTreeNodes.some(deselectedNode => deselectedNode.equals(node))) {
                deselectedTreeNodes.push(node);
            }
            selectedTreeNodes = selectedTreeNodes.filter(selectedNode => !selectedNode.startsWith(node));

            await updateWorkspaceTag(workspace.slug, tag.slug, {
                selectedTreeNodes,
                deselectedTreeNodes,
            });
            await fetchWorkspace();
        } catch (error) {
            logError(error);
        }
    }

    useEffect(() => {
        const initialCollapsedNodes = packages.flatMap(pckg => getChildrenTreeNodes(pckg, pckg.name));

        setCollapsedNodes(initialCollapsedNodes);
    }, [packages]);

    return (
        <div className={classes.tagManagementTree}>
            {packages.map(p => (
                <PackageNode
                    key={p.name}
                    package={p}
                    tags={userTags}
                    collapsedNodes={collapsedNodes}
                    readOnly={readOnly}
                    onCollapse={handleCollapse}
                    onTagAdd={handleTagAdd}
                    onTagRemove={handleTagRemove}/>
            ))}
        </div>
    );
}

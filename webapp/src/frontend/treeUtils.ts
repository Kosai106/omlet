import { isFolderFilterEmpty, type FolderFilter } from "../common/models/FolderFilter";
import { type Tag } from "../common/models/Tag";
import { TreeNode } from "../common/models/TreeNode";

import { type Folder } from "./models/Folder";
import { type Package } from "./models/Package";

export function findDescendantCount(packageName: string, path: string, children: Folder[], collapsedTreeNodes: TreeNode[]): number {
    const folderTreeNode = new TreeNode({ packageName, path: path });

    if (children.length === 0 || collapsedTreeNodes.some(f => f.equals(folderTreeNode))) {
        return 0;
    }

    return children.reduce((sum, child) => sum + findDescendantCount(packageName, child.path, child.children, collapsedTreeNodes), children.length);
}

export function findComponentCount<T extends Pick<Folder, "children" | "numberOfComponents">>(node: T): number {
    if (node.children.length === 0) {
        return node.numberOfComponents;
    }

    return node.children.reduce((sum, child) => sum + findComponentCount(child), node.numberOfComponents);
}

function setComponentNumberMapFromNode(componentNumberMap: Record<string, number>, totalNumberOfComponents: number, children: Folder[], packageName: string, path = "") {
    componentNumberMap[`${packageName}:${path}`] = totalNumberOfComponents;
    children.reduce((acc, child) => setComponentNumberMapFromNode(acc, child.totalNumberOfComponents, child.children, packageName, child.path), componentNumberMap);
    return componentNumberMap;
}

export function createComponentNumberMap(packages: Package[]): Record<string, number> {
    return packages.reduce(
        (acc, { name, children, totalNumberOfComponents }) => setComponentNumberMapFromNode(
            acc,
            totalNumberOfComponents,
            children,
            name
        ),
        {} as Record<string, number>
    );
}

export function combineFolders(folder: Folder, packageName: string, tags: Tag[]): Folder {
    if (folder.children.length !== 1) {
        return folder;
    }

    const [child] = folder.children;
    const currentTreeNode = new TreeNode({ packageName, path: folder.path });
    const childTreeNode = new TreeNode({ packageName, path: child.path });
    const eitherHasTagDefinition = tags.some(({ selectedTreeNodes, deselectedTreeNodes }) =>
        selectedTreeNodes.some(stn => currentTreeNode.equals(stn) || childTreeNode.equals(stn)) ||
        deselectedTreeNodes.some(dtn => currentTreeNode.equals(dtn) || childTreeNode.equals(dtn))
    );

    if (
        folder.totalNumberOfComponents === child.totalNumberOfComponents &&
        !eitherHasTagDefinition
    ) {
        const subCombinedFolder = combineFolders(child, packageName, tags);

        return {
            ...subCombinedFolder,
            children: subCombinedFolder.children.map(child => combineFolders(child, packageName, tags)),
            name: `${folder.name}/${subCombinedFolder.name}`,
        };
    }

    return folder;
}

export function getChildrenTreeNodes(node: { children: Folder[]; }, packageName: string): TreeNode[] {
    return node.children.map(folder => new TreeNode({ packageName, path: folder.path }));
}

function findNode(nodes: Folder[], path: string): Folder | null {
    for (const node of nodes) {
        if (node.path === path) {
            return node;
        }
    }

    for (const node of nodes) {
        if (!path.startsWith(node.path)) {
            continue;
        }

        const foundNode = findNode(node.children, path);

        if (foundNode) {
            return foundNode;
        }
    }

    return null;
}

export function findChildTreeNodes(packages: Package[], node: TreeNode): TreeNode[] {
    const pckg = packages.find(pckg => pckg.name === node.packageName)!;
    if (!pckg) {
        return [];
    }

    if (node.path === "") {
        return getChildrenTreeNodes(pckg, pckg.name);
    }

    const root = findNode(pckg.children, node.path);
    if (!root) {
        return [];
    }

    return getChildrenTreeNodes(root, pckg.name);
}

function getSelectedFolderCountForFolder(packageName: string, folders: Folder[], folderFilter: FolderFilter): number {
    return folders.reduce((sum, folder) => {
        const node = new TreeNode({ packageName, path: folder.path });
        const isSelected = node.isSelected(folderFilter);
        const increment = isSelected ? 1 : 0;

        return sum + increment + getSelectedFolderCountForFolder(packageName, folder.children, folderFilter);
    }, 0);
}

export function getSelectedFolderCount(packages: Package[], folderFilter: FolderFilter): number {
    if (isFolderFilterEmpty(folderFilter)) {
        return 0;
    }

    return packages.reduce((sum, pckg) => {
        const node = new TreeNode({ packageName: pckg.name, path: "" });
        const isSelected = node.isSelected(folderFilter);
        const increment = isSelected ? 1 : 0;

        return sum + increment + getSelectedFolderCountForFolder(pckg.name, pckg.children, folderFilter);
    }, 0);
}

export const NODE_SIZE = 26;
export const LINE_SIZE = 9;

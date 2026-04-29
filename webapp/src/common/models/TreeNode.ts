import { type FolderFilter } from "./FolderFilter";

export interface TreeNodeProps {
    packageName: string;
    path: string;
}

export class TreeNode {
    packageName: string;
    path: string;

    constructor({ packageName, path }: TreeNodeProps) {
        this.packageName = packageName;
        this.path = path;
    }

    startsWith(other: TreeNode): boolean {
        return this.packageName === other.packageName && this.path.startsWith(other.path);
    }

    equals(other: TreeNode): boolean {
        return this.packageName === other.packageName && this.path === other.path;
    }

    toString(): string {
        return `${this.packageName}:${this.path}`;
    }

    isSelected(folders: FolderFilter): boolean {
        const { selectedTreeNodes, deselectedTreeNodes } = folders;

        if (deselectedTreeNodes.some(f => this.equals(f))) {
            return false;
        }

        if (selectedTreeNodes.some(f => this.equals(f))) {
            return true;
        }

        const matchingSelectedTreeNodes = selectedTreeNodes.filter(selectedNode => this.startsWith(selectedNode));
        const matchingDeselectedTreeNodes = deselectedTreeNodes.filter(deselectedNode => this.startsWith(deselectedNode));

        if (matchingSelectedTreeNodes.length === 0 && matchingDeselectedTreeNodes.length === 0) {
            return false;
        }

        if (matchingDeselectedTreeNodes.length === 0) {
            return true;
        }

        if (matchingSelectedTreeNodes.length === 0) {
            return false;
        }

        const bestSelectedMatch = matchingSelectedTreeNodes.reduce((a, b) => a.path.length > b.path.length ? a : b);
        const bestDeselectedMatch = matchingDeselectedTreeNodes.reduce((a, b) => a.path.length > b.path.length ? a : b);

        return bestSelectedMatch.path.length > bestDeselectedMatch.path.length;
    }
}

export function areTreeNodesEqual(treeNodes: TreeNode[], otherTreeNodes: TreeNode[]): boolean {
    return treeNodes.length === otherTreeNodes.length &&
        treeNodes.every(treeNode => otherTreeNodes.some(otherTreeNode => otherTreeNode.equals(treeNode)));
}

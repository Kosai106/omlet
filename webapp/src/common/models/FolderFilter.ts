import { type TreeNode, areTreeNodesEqual } from "./TreeNode";

export interface FolderFilter {
    selectedTreeNodes: TreeNode[];
    deselectedTreeNodes: TreeNode[];
}

export const EMPTY_FOLDER_FILTER: FolderFilter = {
    selectedTreeNodes: [],
    deselectedTreeNodes: [],
};

export function isFolderFilterEmpty(folderFilter: FolderFilter): boolean {
    return folderFilter.selectedTreeNodes.length === 0;
}

export function areFoldersEqual(folders: FolderFilter, otherFolders: FolderFilter): boolean {
    return areTreeNodesEqual(folders.selectedTreeNodes, otherFolders.selectedTreeNodes) &&
        areTreeNodesEqual(folders.deselectedTreeNodes, otherFolders.deselectedTreeNodes);
}

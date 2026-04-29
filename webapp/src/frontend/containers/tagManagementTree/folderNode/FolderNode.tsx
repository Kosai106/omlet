import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import classNames from "classnames";

import { type Tag as TagModel } from "../../../../common/models/Tag";
import { TreeNode } from "../../../../common/models/TreeNode";
import { TruncateFromMiddle } from "../../../common/truncate/TruncateFromMiddle";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { IconBranch } from "../../../library/icons/IconBranch";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { Tag } from "../../../library/Tag/Tag";
import { type Folder } from "../../../models/Folder";
import { AddTagButton } from "../addTag/AddTagButton";
import { DropdownTagPopup } from "../dropdownTagPopup/DropdownTagPopup";
import { VerticalLine } from "../verticalLine/VerticalLine";

import classes from "./FolderNode.module.css";

interface FolderNodeProps {
    folder: Folder;
    packageName: string;
    tags: TagModel[];
    collapsedNodes: TreeNode[];
    readOnly: boolean;
    onCollapse: (node: TreeNode) => void;
    onTagAdd: (tag: TagModel, node: TreeNode) => void;
    onTagRemove: (tag: TagModel, node: TreeNode) => void;
}

export function FolderNode({
    folder,
    packageName,
    tags,
    collapsedNodes,
    readOnly,
    onCollapse,
    onTagAdd,
    onTagRemove,
}: FolderNodeProps) {
    const currentRef = useRef<HTMLDivElement>(null);
    const componentCountRef = useRef<HTMLDivElement>(null);
    const tagsRef = useRef<HTMLDivElement>(null);
    const { width: windowWidth } = useWindowSize();
    const [folderInfoWidth, setFolderInfoWidth] = useState(0);
    const [dropdownState, setDropdownState] = useState<{ anchor: HTMLElement; slug?: string; } | null>(null);

    const currentNode = new TreeNode({ packageName, path: folder.path });
    const collapsed = collapsedNodes.some(collapsedNode => collapsedNode.equals(currentNode));
    const selectedTags = useMemo(() => (
        tags.filter(tag => currentNode.isSelected(tag))
    ), [currentNode.path, currentNode.packageName, tags]);

    useEffect(() => {
        if (!currentRef.current || !tagsRef.current || !componentCountRef.current) {
            return;
        }

        // branchIcon  collapseButton  leftPadding  folderPath         gap  separatorDot  gap  componentCount         gap  tags         rightPadding
        // 8px         16px            4px          <folderInfoWidth>  8px  2px           8px  <componentCountWidth>  8px  <tagsWidth>  8px

        const branchIconWidth = 8;
        const collapseButtonWidth = 16;
        const leftPadding = 4;
        const gap = 8;
        const separatorDotWidth = 2;
        const rightPadding = 8;
        const componentCountWidth = componentCountRef.current.offsetWidth;
        const tagsWidth = tagsRef.current.offsetWidth;

        const otherElementsWidthWithoutCollapseButton = branchIconWidth + leftPadding + gap + separatorDotWidth + gap + componentCountWidth + gap + tagsWidth + rightPadding;
        const otherElementsWidthWithCollapseButton = otherElementsWidthWithoutCollapseButton + collapseButtonWidth;
        const otherElementsWidth = folder.children.length === 0 ? otherElementsWidthWithoutCollapseButton : otherElementsWidthWithCollapseButton;

        setFolderInfoWidth(currentRef.current.offsetWidth - otherElementsWidth);
    }, [currentRef, componentCountRef, tagsRef, folder.children.length === 0, selectedTags, windowWidth]);

    function handleDropdownOpen(e: MouseEvent<HTMLButtonElement>, tag?: TagModel) {
        setDropdownState({ anchor: e.currentTarget, slug: tag?.slug });
    }

    function handleDropdownClose() {
        setDropdownState(null);
    }

    return (
        <div className={classNames(classes.folderNode, { [classes.readOnly]: readOnly })}>
            {!collapsed && <VerticalLine packageName={packageName} folder={folder} collapsedNodes={collapsedNodes}/>}
            <div className={classes.current} ref={currentRef}>
                <IconBranch
                    className={classes.branchIcon}
                    color="var(--button-background-disabled-color)"/>
                <div className={classNames(classes.row)}>
                    {folder.children.length !== 0 && (
                        <button
                            type="button"
                            className={classNames(classes.collapseButton, { [classes.collapsed]: collapsed })}
                            onClick={() => onCollapse(currentNode)}>
                            <IconChevronDown/>
                        </button>
                    )}
                    <div className={classes.cell}>
                        <TruncateFromMiddle className={classes.folderInfo} text={folder.name} width={folderInfoWidth}/>
                        <span className={classes.separatorDot}/>
                        <span className={classes.componentCount} ref={componentCountRef}>{folder.totalNumberOfComponents}</span>
                        <div className={classes.tags} ref={tagsRef}>
                            {selectedTags.map(tag => (
                                <Tag
                                    key={tag.slug}
                                    tag={tag}
                                    className={classes.tag}
                                    large
                                    active={dropdownState?.slug === tag.slug}
                                    onClick={handleDropdownOpen} />
                            ))}
                            {!readOnly && <AddTagButton className={dropdownState && !dropdownState.slug ? undefined : classes.addTag} onClick={handleDropdownOpen} />}
                        </div>
                        {dropdownState && (
                            <DropdownTagPopup
                                anchor={dropdownState.anchor}
                                tags={tags}
                                selectedTags={selectedTags}
                                onAdd={tag => onTagAdd(tag, currentNode)}
                                onRemove={tag => onTagRemove(tag, currentNode)}
                                onClose={handleDropdownClose} />
                        )}
                    </div>
                </div>
            </div>
            {!collapsed && folder.children.map(child =>
                <FolderNode
                    key={child.path}
                    folder={child}
                    packageName={packageName}
                    tags={tags}
                    collapsedNodes={collapsedNodes}
                    readOnly={readOnly}
                    onCollapse={onCollapse}
                    onTagAdd={onTagAdd}
                    onTagRemove={onTagRemove}/>
            )}
        </div>
    );
}

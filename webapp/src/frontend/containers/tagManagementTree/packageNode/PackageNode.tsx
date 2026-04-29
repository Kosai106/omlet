import { type MouseEvent, useMemo, useState, useEffect, useRef } from "react";

import classNames from "classnames";

import { type Tag as TagModel } from "../../../../common/models/Tag";
import { TreeNode } from "../../../../common/models/TreeNode";
import { pluralize } from "../../../../common/utils";
import { TruncateFromMiddle } from "../../../common/truncate/TruncateFromMiddle";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { IconChevronDown } from "../../../library/icons/IconChevronDown";
import { IconFolder } from "../../../library/icons/IconFolder";
import { Tag } from "../../../library/Tag/Tag";
import { type Package } from "../../../models/Package";
import { AddTagButton } from "../addTag/AddTagButton";
import { DropdownTagPopup } from "../dropdownTagPopup/DropdownTagPopup";
import { FolderNode } from "../folderNode/FolderNode";

import classes from "./PackageNode.module.css";

interface PackageNodeProps {
    package: Package;
    tags: TagModel[];
    collapsedNodes: TreeNode[];
    readOnly: boolean;
    onCollapse: (node: TreeNode) => void;
    onTagAdd: (tag: TagModel, node: TreeNode) => void;
    onTagRemove: (tag: TagModel, node: TreeNode) => void;
}

export function PackageNode({
    package: {
        name,
        totalNumberOfComponents,
        children,
    },
    tags,
    collapsedNodes,
    readOnly,
    onCollapse,
    onTagAdd,
    onTagRemove,
}: PackageNodeProps) {
    const packageInfoRef = useRef<HTMLDivElement>(null);
    const componentCountRef = useRef<HTMLDivElement>(null);
    const tagsRef = useRef<HTMLDivElement>(null);
    const { width: windowWidth } = useWindowSize();
    const [packageNameWidth, setPackageNameWidth] = useState(0);
    const [dropdownState, setDropdownState] = useState<{ anchor: HTMLElement; slug?: string; } | null>(null);

    const currentNode = new TreeNode({ packageName: name, path: "" });
    const collapsed = collapsedNodes.some(collapsedNode => collapsedNode.equals(currentNode));
    const selectedTags = useMemo(() => (
        tags.filter(tag => currentNode.isSelected(tag))
    ), [currentNode.packageName, tags]);

    useEffect(() => {
        if (!packageInfoRef.current || !tagsRef.current || !componentCountRef.current) {
            return;
        }

        // collapseButton  folderIcon  gap  packageName         gap  separatorDot  gap  componentCount         gap  tags         rightPadding
        // 16px            20px        8px  <packageNameWidth>  8px  2px           8px  <componentCountWidth>  8px  <tagsWidth>  8px

        const collapseButtonWidth = 16;
        const folderIconWidth = 20;
        const gap = 8;
        const separatorDotWidth = 2;
        const rightPadding = 8;
        const componentCountWidth = componentCountRef.current.offsetWidth;
        const tagsWidth = tagsRef.current.offsetWidth;

        const otherElementsWidth = collapseButtonWidth + folderIconWidth + gap + gap + separatorDotWidth + gap + componentCountWidth + gap + tagsWidth + rightPadding;

        setPackageNameWidth(packageInfoRef.current.offsetWidth - otherElementsWidth);
    }, [packageInfoRef, componentCountRef, tagsRef, selectedTags, windowWidth]);

    function handleDropdownOpen(e: MouseEvent<HTMLButtonElement>, tag?: TagModel) {
        setDropdownState({ anchor: e.currentTarget, slug: tag?.slug });
    }

    function handleDropdownClose() {
        setDropdownState(null);
    }

    return (
        <div className={classNames(classes.packageNode, { [classes.readOnly]: readOnly })}>
            <div className={classes.packageLine}/>
            <div className={classes.packageInfo} ref={packageInfoRef}>
                <div className={classes.row}>
                    <div className={classes.icons}>
                        <button
                            type="button"
                            className={classNames(classes.collapseButton, { [classes.collapsed]: collapsed })}
                            onClick={() => onCollapse(currentNode)}>
                            <IconChevronDown/>
                        </button>
                        <IconFolder/>
                    </div>
                    <TruncateFromMiddle className={classes.packageName} text={name} width={packageNameWidth}/>
                    <span className={classes.separatorDot}/>
                    <span className={classes.componentCount} ref={componentCountRef}>{pluralize("component", totalNumberOfComponents)}</span>
                    <div className={classes.tags} ref={tagsRef}>
                        {selectedTags.map(tag => (
                            <Tag
                                key={tag.slug}
                                tag={tag}
                                className={classes.tag}
                                large
                                active={dropdownState?.slug === tag.slug}
                                onClick={handleDropdownOpen}/>
                        ))}
                        {!readOnly && <AddTagButton className={dropdownState && !dropdownState.slug ? undefined : classes.addTag} onClick={handleDropdownOpen}/>}
                    </div>
                    {dropdownState && (
                        <DropdownTagPopup
                            anchor={dropdownState.anchor}
                            tags={tags}
                            selectedTags={selectedTags}
                            onAdd={(tag) => onTagAdd(tag, currentNode)}
                            onRemove={(tag) => onTagRemove(tag, currentNode)}
                            onClose={handleDropdownClose} />
                    )}
                </div>
            </div>
            {
                !collapsed && (
                    <div className={classes.folders}>
                        {children.map(folder =>
                            <FolderNode
                                key={folder.path}
                                folder={folder}
                                packageName={name}
                                tags={tags}
                                collapsedNodes={collapsedNodes}
                                readOnly={readOnly}
                                onCollapse={onCollapse}
                                onTagAdd={onTagAdd}
                                onTagRemove={onTagRemove}/>
                        )}
                    </div>
                )
            }
        </div>
    );
}

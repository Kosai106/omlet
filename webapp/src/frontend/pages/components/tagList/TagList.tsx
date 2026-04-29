import classNames from "classnames";

import { type Tag } from "../../../../common/models/Tag";
import { Callout, CalloutKind } from "../../../library/Callout/Callout";
import { IconComponents } from "../../../library/icons/IconComponents";

import { TagItem } from "./tagItem/TagItem";

import classes from "./TagList.module.css";

interface Props {
    tags: Tag[];
    selectedTag?: Tag;
    hasOverrides?: boolean;
    isTagsCalloutHidden: boolean;
    readOnly?: boolean;
    onTagsCalloutDismiss(): void;
    onSelect(tagSlug?: string): void;
    onRename(tagSlug: string, name: string): void;
    onDelete(tag: Tag): void;
}

export function TagList({
    tags,
    selectedTag,
    hasOverrides = false,
    isTagsCalloutHidden,
    readOnly = false,
    onTagsCalloutDismiss,
    onSelect,
    onRename,
    onDelete,
}: Props) {
    function renderTagsCallout() {
        if (isTagsCalloutHidden) {
            return null;
        }

        return (
            <section>
                <Callout
                    kind={CalloutKind.Onboarding}
                    onDismiss={onTagsCalloutDismiss}>
                    Use tags to group a subset<br/>
                    of your components using various filters.<br/>
                    <br/>
                    To create a new tag, start by filtering components on the right. 👉
                </Callout>
            </section>
        );
    }

    return (
        <div className={classes.tagList}>
            <section>
                <button
                    type="button"
                    className={classNames(classes.allComponentsButton, {
                        [classes.selected]: selectedTag === undefined,
                    })}
                    onClick={() => onSelect()}>
                    <IconComponents/> All components
                </button>
            </section>
            <section>
                <h3>Tags</h3>
                {tags.map(tag =>
                    <TagItem
                        key={tag.slug}
                        tag={tag}
                        tags={tags}
                        selected={tag === selectedTag}
                        hasOverrides={tag === selectedTag && hasOverrides}
                        readOnly={readOnly}
                        onSelect={onSelect}
                        onRename={onRename}
                        onDelete={onDelete}/>
                )}
            </section>
            {renderTagsCallout()}
        </div>
    );
}

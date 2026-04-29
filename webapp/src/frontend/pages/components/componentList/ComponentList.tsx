import { type RefObject, useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";

import { pluralize } from "../../../../common/utils";
import { TruncateFromMiddle } from "../../../common/truncate/TruncateFromMiddle";
import { TruncatePath } from "../../../common/truncate/TruncatePath";
import { useWindowSize } from "../../../hooks/useWindowSize";
import { IconChild } from "../../../library/icons/IconChild";
import { Skeleton } from "../../../library/Skeleton/Skeleton";
import { Tag } from "../../../library/Tag/Tag";
import { type Component } from "../../../models/Component";
import { useStore } from "../../../providers/StoreProvider/StoreProvider";
import { formatDate } from "../../../utils";

import classes from "./ComponentList.module.css";

interface EmptyStateProps {
    onResetClick?(): void;
}

function EmptyState({ onResetClick }: EmptyStateProps) {
    const text = onResetClick
        ? "No results with this selection"
        : "No components in your workspace";

    return (
        <div className={classes.emptyState}>
            <div className={classes.shrug}>¯\_(ツ)_/¯</div>
            <p>{text}</p>
            {onResetClick && (
                <button className={classes.resetButton} type="button" onClick={onResetClick}>Reset filters</button>
            )}
        </div>
    );
}

function optionalDateToString(date?: Date): string {
    return date === undefined
        ? "Over a year"
        : formatDate(date);
}

function ComponentListItem({
    definitionId,
    name,
    packageName,
    numOfDependencies,
    numOfUsages,
    path,
    tags: tagSlugs,
    createdAt,
    updatedAt,
}: Component) {
    const {
        selectors: { getTags },
    } = useStore();
    const mainRef = useRef<HTMLDivElement>(null);
    const projectRef = useRef<HTMLSpanElement>(null);
    const pathRef = useRef<HTMLDivElement>(null);
    const { width: windowWidth } = useWindowSize();
    const [widths, setWidths] = useState({ name: 0, path: 0 });
    const tagSlugSet = new Set(tagSlugs);
    const tags = getTags().filter(({ slug }) => tagSlugSet.has(slug));

    useEffect(() => {
        if (!mainRef.current || !projectRef.current || !pathRef.current) {
            return;
        }
        setWidths({
            name: Math.min(mainRef.current.offsetWidth - projectRef.current.offsetWidth - 8, 320),
            path: pathRef.current.offsetWidth,
        });
    }, [mainRef, projectRef, pathRef, windowWidth]);

    return (
        <Link className={classes.item} to={encodeURIComponent(`${name}::${definitionId}`)}>
            <div className={classes.componentDetails}>
                <div className={classes.main} ref={mainRef}>
                    <TruncateFromMiddle text={name} className={classes.name} width={widths.name} />
                    <span className={classes.project} ref={projectRef}>{packageName}</span>
                </div>
                <div className={classes.metadata}>
                    {tags.length !== 0 && (
                        <div className={classes.tags}>
                            {tags.map(tag => <Tag key={tag.slug} tag={tag}/>)}
                        </div>
                    )}
                    <span className={classes.childCount} title={pluralize("child", numOfDependencies, { pluralForm: "children" })}><IconChild/> {numOfDependencies}</span>
                    <div className={classes.path} ref={pathRef}>
                        <TruncatePath className={classes.path} text={path} width={widths.path} />
                    </div>
                </div>
            </div>
            <span className={classes.date}>{optionalDateToString(createdAt)}</span>
            <span className={classes.date}>{optionalDateToString(updatedAt)}</span>
            <span className={classes.usageCount}>{pluralize("time", numOfUsages)}</span>
        </Link>
    );
}

function ComponentListSkeleton() {
    return (
        <>
            {
                Array(10).fill(null).map((_, i) => (
                    <div key={i} className={classes.item}>
                        <div className={classes.componentDetails}>
                            <div className={classes.main}>
                                <Skeleton className={classes.skeleton} />
                            </div>
                            <div className={classes.metadata}>
                                <Skeleton className={classes.skeleton} />
                            </div>
                        </div>
                        <div className={classes.date}>
                            <Skeleton className={classes.skeleton} />
                        </div>
                        <div className={classes.date}>
                            <Skeleton className={classes.skeleton} />
                        </div>
                        <div className={classes.usageCount}>
                            <Skeleton className={classes.skeleton} />
                        </div>
                    </div>
                ))
            }
        </>

    );
}

interface Props {
    loading: boolean;
    components: Component[];
    scrollContainerRef: RefObject<HTMLElement>;
    searchTerm: string;
    selectedTags: string[];
    limit: number;
    onResetFilters(): void;
    onEnd(): void;
}

export function ComponentList({
    loading,
    components,
    scrollContainerRef,
    searchTerm,
    selectedTags,
    limit,
    onResetFilters,
    onEnd,
}: Props) {
    const componentListRef = useRef<HTMLDivElement>(null);
    const intersectionObserveeRef = useRef<HTMLDivElement>(null);
    const intersectionObserverRef = useRef<IntersectionObserver>();

    useEffect(() => {
        if (intersectionObserveeRef.current && components !== undefined && components.length >= limit) {
            intersectionObserverRef.current = new IntersectionObserver(entries => {
                const isIntersecting = entries.some(({ isIntersecting }) => isIntersecting);
                if (isIntersecting) {
                    onEnd();
                }
            }, {
                root: scrollContainerRef.current,
                rootMargin: "0px 0px 320px 0px",
            });

            intersectionObserverRef.current.observe(intersectionObserveeRef.current);
        } else {
            intersectionObserverRef.current?.disconnect();
        }

        return () => {
            intersectionObserverRef.current?.disconnect();
        };
    }, [components]);

    function renderComponents() {
        if (loading) {
            return <ComponentListSkeleton />;
        }

        if (components.length === 0) {
            return <EmptyState onResetClick={searchTerm !== "" || selectedTags.length !== 0 ? onResetFilters : undefined}/>;
        }

        return (
            <>
                {components.map(component =>
                    <ComponentListItem key={component.id} {...component}/>
                )}
                <div key="intersectionObservee" ref={intersectionObserveeRef}/>
            </>
        );
    }

    return (
        <div className={classes.componentList} ref={componentListRef}>
            {renderComponents()}
        </div>
    );
}

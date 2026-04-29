import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";

import classNames from "classnames";
import { useSearchParams } from "react-router-dom";
import { type Node as FlowNode, type Edge, type FitViewOptions, ReactFlow, Controls, ReactFlowProvider, useNodesInitialized, useReactFlow } from "reactflow";

import { type Component } from "../../../models/Component";
import { type ComponentWithLevel } from "../ComponentDetail";

import { type Filters, type DependencyType, DependencyList } from "./dependencyList/DependencyList";
import { Node } from "./node/Node";
import { ShowMoreNode } from "./showMoreNode/ShowMoreNode";

import "reactflow/dist/style.css";
import classes from "./TreeView.module.css";

const HORIZONTAL_NODE_DISTANCE = 72;
const VERTICAL_NODE_DISTANCE = 32;
const LEVEL_WIDTH = 160;
const NODE_HEIGHT = 24;
const PADDING = 32;
const MIN_ZOOM_LEVEL = 0.5;
const DEFAULT_ZOOM_LEVEL = 1;
const MAX_ZOOM_LEVEL = 2;
const DEPENDENCY_LIST_WIDTH = 300;
const FIRST_PAGE_SIZE = 12;
const LOAD_MORE_SIZE = 20;
const NEW_PAGE_HEIGHT_SCROLL = 48;
const HIDDEN_RIGHT_NODE_ID = "hidden-rightNode";

interface Props {
    loading?: boolean;
    mainComponent?: Component;
    parents: ComponentWithLevel[];
    children: ComponentWithLevel[];
    selectedComponent?: ComponentWithLevel;
    dependencyMap: Record<string, Set<string>>;
    reverseDependencyMap: Record<string, Set<string>>;
    nodeCountByLevel: Record<string, number>;
    setNodeCountByLevel(newMap: Record<string, number>): void;
}

export type ComponentWithDependencyTreeData = ComponentWithLevel & { highlighted: boolean; selected: boolean; };

const nodeTypes = {
    node: Node,
    showMoreNode: ShowMoreNode,
};

function TreeView({
    loading = false,
    mainComponent,
    parents,
    children,
    dependencyMap,
    reverseDependencyMap,
    nodeCountByLevel,
    setNodeCountByLevel,
}: Props) {
    const [loadingTree, setLoadingTree] = useState(true);
    const [initialScroll, setInitialScroll] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const nodesInitialized = useNodesInitialized();
    const elementRef = useRef<HTMLDivElement>(null);
    const reactFlow = useReactFlow<ComponentWithDependencyTreeData, Edge>();
    const components = useMemo<ComponentWithLevel[]>(() => !loading ? [{ ...mainComponent!, level: 0 }, ...parents, ...children] : [], [loading, parents, mainComponent, children]);
    const selectedComponentId = searchParams.get("selected") ?? undefined;

    useEffect(() => {
        setLoadingTree(true);

        const selectedComponent = components.find(({ id }) => id === selectedComponentId);
        const visibleComponents = getVisibleNodeIds(selectedComponent);

        const nodes = components.map<FlowNode<ComponentWithDependencyTreeData>>(data => {
            return {
                id: data.definitionId,
                type: "node",
                data: {
                    ...data,
                    highlighted: false,
                    selected: data.id === selectedComponentId,
                },
                zIndex: 20,
                position: {
                    x: 0,
                    y: 0,
                },
                hidden: !visibleComponents.has(data.definitionId),
            };
        });


        nodes.sort((node1, node2) => node2.data.numOfUsages - node1.data.numOfUsages);

        let nodesToShow: FlowNode[] = [];
        const showMoreEdges: Edge<Edge>[] = [];

        if (!selectedComponentId) {
            const nodesByLevel = nodes.reduce((map, node) => {
                if (map[node.data.level]) {
                    map[node.data.level].push(node);
                } else {
                    map[node.data.level] = [node];
                }
                return map;
            }, {} as Record<number, FlowNode[]>);

            Object.entries(nodesByLevel).forEach(([level, levelNodes]) => {
                const nodeCountToShow = nodeCountByLevel[level] || FIRST_PAGE_SIZE;
                const toAdd = levelNodes.slice(0, nodeCountToShow);

                const toHide = levelNodes.slice(nodeCountToShow).map(node => ({ ...node, hidden: true }));

                toHide.forEach(node => {
                    visibleComponents.delete(node.id);
                });

                if (toHide.length > 0) {
                    const showMoreNodeId = `showMore-${level}`;
                    const showMoreNode = {
                        id: showMoreNodeId,
                        type: "showMoreNode",
                        zIndex: 30,
                        position: {
                            x: 0,
                            y: 0,
                        },
                        data: {
                            level,
                            nodeCount: toHide.length,
                            onClick: () => handleShowMoreNodeClick(showMoreNodeId),
                        },
                        hidden: false,
                    };
                    toAdd.push(showMoreNode);
                    if (level === "1" || level === "-1") {
                        const centerNode = nodesByLevel[0][0];
                        const source = level === "1" ? centerNode.id : showMoreNodeId;
                        const target = level === "1" ? showMoreNodeId : centerNode.id;
                        showMoreEdges.push({
                            id: `${source} ${target}`,
                            className: classes.edge,
                            source,
                            target,
                            hidden: false,
                        });
                    }
                }
                nodesToShow = [...nodesToShow, ...toAdd, ...toHide];
            });
        }


        const edges = Object.entries(dependencyMap).flatMap(([source, targets]) => [...targets].map(target => ({
            id: `${source} ${target}`,
            className: classes.edge,
            source,
            target,
            hidden: !visibleComponents.has(source) || !visibleComponents.has(target),
        })));

        reactFlow.setNodes(selectedComponentId ? nodes : nodesToShow);
        reactFlow.setEdges([...edges, ...showMoreEdges]);
        if (nodesInitialized) {
            positionNodes();
        }
    }, [components, nodeCountByLevel, selectedComponentId]);

    useEffect(() => {
        if (nodesInitialized) {
            positionNodes();
            setLoadingTree(false);
        }
    }, [nodesInitialized, selectedComponentId]);

    useEffect(() => {
        setInitialScroll(true);
    }, [selectedComponentId, mainComponent?.id]);

    function handleShowMoreNodeClick(nodeId: string) {
        const showMoreNode = reactFlow.getNode(nodeId)!;
        const level = showMoreNode.data.level;
        setNodeCountByLevel({
            ...nodeCountByLevel,
            [level]: (nodeCountByLevel[level] || FIRST_PAGE_SIZE) + LOAD_MORE_SIZE,
        });
        scrollDownIfNecessary(showMoreNode);
    }

    function getFilters(): Filters {
        const selectedLevel = searchParams.get("level");
        return {
            dependencyType: searchParams.get("type") as DependencyType ?? undefined,
            selectedTags: searchParams.getAll("tag"),
            selectedLevel: !selectedLevel || Number.isNaN(Number(selectedLevel)) ? undefined : Number(selectedLevel),
            selectedProject: searchParams.get("project") ?? undefined,
            searchValue: searchParams.get("q") ?? "",
        };
    }

    function handleSearchParamsChange(next: URLSearchParams) {
        const previousTags = new Set(searchParams.getAll("tag"));
        const nextTags = new Set(next.getAll("tag"));
        if (
            next.get("type") !== searchParams.get("type")
            || next.get("level") !== searchParams.get("level")
            || next.get("project") !== searchParams.get("project")
            || next.get("q") !== searchParams.get("q")
            || next.get("selected") !== searchParams.get("selected")
            || [...nextTags].some(tag => !previousTags.has(tag))
            || [...previousTags].some(tag => !nextTags.has(tag))
        ) {
            setSearchParams(next, { replace: true });
        }
    }

    function handleSelectedComponentIdChange(next?: string) {
        const nextComponent = components.find(({ id }) => id === next);

        const nextParams = new URLSearchParams(searchParams);
        if (nextComponent) {
            nextParams.set("selected", nextComponent.id);
        } else {
            nextParams.delete("selected");
        }
        handleSearchParamsChange(nextParams);
    }

    function handleFiltersChange(next: Filters) {
        const nextParams = new URLSearchParams();
        if (selectedComponentId) {
            nextParams.set("selected", selectedComponentId);
        }
        if (next.dependencyType) {
            nextParams.set("type", next.dependencyType);
        }
        for (const tag of next.selectedTags) {
            nextParams.append("tag", tag);
        }
        if (next.selectedLevel) {
            nextParams.set("level", next.selectedLevel.toString());
        }
        if (next.searchValue) {
            nextParams.set("q", next.searchValue);
        }
        if (next.selectedProject) {
            nextParams.set("project", next.selectedProject);
        }
        handleSearchParamsChange(nextParams);
    }

    function getVisibleNodeIds(nextSelectedComponent?: ComponentWithLevel) {
        if (!nextSelectedComponent) {
            return new Set(components.map(({ definitionId }) => definitionId));
        }
        const nodeIds = getHighlightedNodes(
            nextSelectedComponent.definitionId,
            nextSelectedComponent.level < 0
                ? dependencyMap
                : reverseDependencyMap
        );
        nodeIds.add(mainComponent?.definitionId ?? "");
        return nodeIds;
    }

    function fitView() {
        const nodes = reactFlow.getNodes();
        if (!nodes || !nodes.length) {
            return;
        }

        const fitViewOptions = getFitViewOptions(nodes);
        const hiddenRightNode = fitViewOptions.nodes?.find(({ id }) => id === HIDDEN_RIGHT_NODE_ID);

        if (hiddenRightNode && nodes.every(({ id }) => id !== HIDDEN_RIGHT_NODE_ID)) {
            nodes.push(hiddenRightNode as FlowNode<ComponentWithDependencyTreeData>);
            reactFlow.setNodes(nodes);
        }

        reactFlow.fitView(fitViewOptions);
    }

    function scrollDownIfNecessary(showMoreNode: FlowNode) {
        const height = elementRef?.current?.getBoundingClientRect()?.height ?? 0;
        const viewPort = reactFlow.getViewport();
        if (showMoreNode.position.y - (height / 2) > viewPort.y * -1) {
            reactFlow.setViewport({
                ...viewPort,
                y: viewPort.y - NEW_PAGE_HEIGHT_SCROLL,
            }, { duration: 800 });
        }
    }

    function positionNodes() {
        const nodes = reactFlow.getNodes();
        if (!nodes || !nodes.length) {
            return;
        }

        const visibleNodes = nodes.filter(({ hidden }) => hidden === false);

        const levelDistances: Record<number, number> = {};
        for (const node of visibleNodes) {
            const level = node.data.level;
            if (level in levelDistances) {
                node.position.y = levelDistances[level] + VERTICAL_NODE_DISTANCE;
                levelDistances[level] += NODE_HEIGHT + VERTICAL_NODE_DISTANCE;
            } else {
                node.position.y = 0;
                levelDistances[level] = NODE_HEIGHT;
            }
            node.position.x = (
                level < 0
                    ? (level * (LEVEL_WIDTH + HORIZONTAL_NODE_DISTANCE)) + LEVEL_WIDTH - (node.width ?? 0)
                    : (level * (LEVEL_WIDTH + HORIZONTAL_NODE_DISTANCE))
            );
        }

        for (const node of visibleNodes) {
            const level = node.data.level;
            const offset = Math.min(levelDistances[level], FIRST_PAGE_SIZE * (VERTICAL_NODE_DISTANCE + NODE_HEIGHT)) / 2;
            node.position.y -= offset;
        }

        const fitViewOptions = getFitViewOptions(nodes);

        const hiddenRightNode = fitViewOptions.nodes?.find(({ id }) => id === HIDDEN_RIGHT_NODE_ID);

        if (hiddenRightNode && nodes.every(({ id }) => id !== HIDDEN_RIGHT_NODE_ID)) {
            nodes.push(hiddenRightNode as FlowNode<ComponentWithDependencyTreeData>);
        }

        reactFlow.setNodes(nodes);
        if (selectedComponentId || initialScroll) {
            reactFlow.fitView(fitViewOptions);
            setInitialScroll(false);
        }
    }

    function getMaxVisibleLevelForFitView(zoomLevel: number) {
        const width = elementRef?.current?.getBoundingClientRect()?.width ?? 0;
        const levelWidthWithZoom = Math.ceil(LEVEL_WIDTH * zoomLevel);
        const levelWidthWithZoomAndDistance = Math.ceil((LEVEL_WIDTH + HORIZONTAL_NODE_DISTANCE) * zoomLevel);
        return Math.floor((width - (2 * PADDING) - DEPENDENCY_LIST_WIDTH - levelWidthWithZoom) / levelWidthWithZoomAndDistance);
    }

    function getZoom(numberOfLevels: number) {
        const width = elementRef?.current?.getBoundingClientRect()?.width ?? 0;
        const totalNodesWidth = ((LEVEL_WIDTH + HORIZONTAL_NODE_DISTANCE) * numberOfLevels) + LEVEL_WIDTH;
        return (width - (2 * PADDING) - DEPENDENCY_LIST_WIDTH) / totalNodesWidth;
    }

    function getFitViewOptions(nodes: FlowNode<ComponentWithDependencyTreeData>[]): FitViewOptions {
        const visibleNodes = nodes.filter(({ hidden }) => hidden === false);
        const mainNode = visibleNodes.find(node => node.data.level === 0);
        const centerY = mainNode?.position?.y ?? 0;

        const centerNodes: Record<number, FlowNode<ComponentWithDependencyTreeData>> = { };
        const levels: number[] = [];
        for (const node of visibleNodes) {
            const level = node.data.level;
            if (!centerNodes[level]) {
                centerNodes[level] = node;
                levels.push(level);
            } else if (Math.abs(centerNodes[level].position.y - centerY) > Math.abs(node.position.y - centerY)) {
                centerNodes[level] = node;
            }
        }

        let maxVisibleLevelForFitView = getMaxVisibleLevelForFitView(DEFAULT_ZOOM_LEVEL);
        if (maxVisibleLevelForFitView <= 1) {
            maxVisibleLevelForFitView = getMaxVisibleLevelForFitView(MIN_ZOOM_LEVEL);
        }
        const maxLevel = Math.max(...levels);
        const minLevel = Math.min(...levels);
        let visibleMinLevel = -1 * Math.ceil(maxVisibleLevelForFitView / 2);
        let visibleMaxLevel = maxVisibleLevelForFitView + visibleMinLevel;
        if (minLevel > visibleMinLevel) {
            visibleMinLevel = minLevel;
            visibleMaxLevel = Math.min(maxVisibleLevelForFitView + minLevel, maxLevel);
        } else if (maxLevel < visibleMaxLevel) {
            visibleMinLevel = Math.max(-1 * (maxVisibleLevelForFitView - maxLevel), minLevel);
            visibleMaxLevel = maxLevel;
        }

        const zoom = Math.min(
            MAX_ZOOM_LEVEL,
            Math.max(MIN_ZOOM_LEVEL, getZoom(visibleMaxLevel - visibleMinLevel))
        );

        const rightNode = centerNodes[visibleMaxLevel];

        // This hidden node prevents having nodes under the dependency list
        const hiddenRightNode = rightNode ? [{
            width: DEPENDENCY_LIST_WIDTH / zoom,
            height: rightNode.height,
            data: {} as ComponentWithDependencyTreeData,
            id: HIDDEN_RIGHT_NODE_ID,
            position: {
                x: rightNode.position.x + (rightNode.width ?? 0),
                y: rightNode.position.y,
            },
            hidden: true,
        }] : [];

        return {
            minZoom: zoom,
            maxZoom: zoom,
            padding: PADDING,
            nodes: [
                ...levels.filter(level => level >= visibleMinLevel && level <= visibleMaxLevel).map(level => centerNodes[level]),
                ...hiddenRightNode,
            ],
            includeHiddenNodes: true,
        };
    }

    function getHighlightedNodes(nodeId: string, dependencyMap: Record<string, Set<string>>) {
        const queue = [nodeId];
        const highlightedNodes = new Set(queue);
        while (queue.length) {
            const currentNode = queue.pop()!;
            const nextNodes = dependencyMap[currentNode] ?? new Set();
            for (const nextNode of nextNodes) {
                if (!highlightedNodes.has(nextNode) && nextNode !== mainComponent?.definitionId) {
                    highlightedNodes.add(nextNode);
                    queue.push(nextNode);
                }
            }
        }
        return highlightedNodes;
    }

    function handleMouseEnter(e: MouseEvent, node: FlowNode<ComponentWithDependencyTreeData>) {
        if (node.data.level === 0) {
            return;
        }
        const highlightedNodes = new Set([
            mainComponent?.definitionId ?? "",
            ...getHighlightedNodes(node.id, dependencyMap),
            ...getHighlightedNodes(node.id, reverseDependencyMap),
        ]);

        reactFlow.setNodes(nodes => nodes.map(node => {
            node.data = {
                ...node.data,
                highlighted: highlightedNodes.has(node.id),
            };
            return node;
        }));
        reactFlow.setEdges(edges => edges.map(edge => {
            const highlighted = highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target);
            edge.className = classNames(classes.edge, { [classes.highlighted]: highlighted });
            edge.zIndex = highlighted ? 10 : 0;
            return edge;
        }));
    }

    function handleMouseLeave() {
        reactFlow.setNodes(nodes => nodes.map(node => {
            node.data = {
                ...node.data,
                highlighted: false,
            };
            return node;
        }));
        reactFlow.setEdges(edges => edges.map(edge => {
            edge.className = classes.edge;
            edge.zIndex = 0;
            return edge;
        }));
    }

    return (
        <div className={classNames(classes.treeView, { [classes.loading]: loadingTree })}>
            <div className={classes.title}>Dependency Tree</div>
            <div className={classes.content}>
                <ReactFlow
                    ref={elementRef}
                    defaultNodes={[]}
                    defaultEdges={[]}
                    nodeTypes={nodeTypes}
                    panOnScroll
                    onlyRenderVisibleElements
                    elementsSelectable={false}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    edgesFocusable={false}
                    edgesUpdatable={false}
                    onNodeMouseEnter={handleMouseEnter}
                    onNodeMouseLeave={handleMouseLeave}>
                    <Controls
                        showInteractive={false}
                        onFitView={fitView}/>
                </ReactFlow>
                <DependencyList
                    loading={loading}
                    mainComponent={mainComponent}
                    parents={parents}
                    children={children}
                    filters={getFilters()}
                    onFiltersChange={handleFiltersChange}
                    selectedComponentId={selectedComponentId}
                    onSelectedComponentIdChange={handleSelectedComponentIdChange}/>
            </div>
        </div>
    );
}

export function TreeViewWithReactFlowProvider(props: Props) {
    return (
        <ReactFlowProvider>
            <TreeView {...props}/>
        </ReactFlowProvider>
    );
}

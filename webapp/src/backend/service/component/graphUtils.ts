class EdgeSet {
    private edges: [string, string][];
    private edgeKeys: Set<string>;

    private getKey(edge: [string, string]): string {
        return `${edge[0]}-${edge[1]}`;
    }

    constructor() {
        this.edges = [];
        this.edgeKeys = new Set([]);
    }

    add(edge: [string, string]) {
        const key = this.getKey(edge);

        if (!this.edgeKeys.has(key)) {
            this.edgeKeys.add(key);
            this.edges.push(edge);
        }
    }

    has(edge: [string, string]) {
        return this.edgeKeys.has(this.getKey(edge));
    }

    toArray() {
        return Array.from(this.edges);
    }
}

function findLowerSubgraph(adjacencyMap: AdjacencyMap, nodes: Set<string>, edges: EdgeSet, startNode: string, visitedNodes: string[]) {
    if (visitedNodes.includes(startNode)) {
        return;
    }

    visitedNodes.push(startNode);

    const successors = adjacencyMap[startNode]?.successors ?? [];
    for (const n of successors) {
        nodes.add(n);
        edges.add([startNode, n]);
        findLowerSubgraph(adjacencyMap, nodes, edges, n, visitedNodes);
    }
}


function findUpperSubgraph(adjacencyMap: AdjacencyMap, nodes: Set<string>, edges: EdgeSet, startNode: string, visitedNodes: string[]) {
    if (visitedNodes.includes(startNode)) {
        return;
    }

    visitedNodes.push(startNode);

    const predecessors = adjacencyMap[startNode]?.predecessors ?? [];
    for (const n of predecessors) {
        nodes.add(n);
        edges.add([n, startNode]);
        findUpperSubgraph(adjacencyMap, nodes, edges, n, visitedNodes);
    }
}

function reconcileGraphs(adjacencyMap: AdjacencyMap, nodes: Set<string>, edges: EdgeSet) {
    for (const node of nodes.values()) {
        const successors = adjacencyMap[node]?.successors ?? [];

        for (const successor of successors) {
            if (nodes.has(successor)) {
                edges.add([node, successor]);
            }
        }
    }
}

export interface Graph {
    nodes: string[];
    edges: [string, string][];
}

export type AdjacencyMap = Record<string, {
    successors: string[];
    predecessors: string[];
}>;

export function findSubgraph(adjacencyMap: AdjacencyMap, startNode: string): Graph {
    const nodes = new Set<string>([startNode]);
    const edges = new EdgeSet();

    let visitedNodes: string[] = [];
    findLowerSubgraph(adjacencyMap, nodes, edges, startNode, visitedNodes);

    visitedNodes = [];
    findUpperSubgraph(adjacencyMap, nodes, edges, startNode, visitedNodes);

    reconcileGraphs(adjacencyMap, nodes, edges);

    return { nodes: [...nodes], edges: edges.toArray() };
}

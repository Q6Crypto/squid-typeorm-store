"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitOrder = getCommitOrder;
var State;
(function (State) {
    State[State["Unvisited"] = 0] = "Unvisited";
    State[State["Visiting"] = 1] = "Visiting";
    State[State["Visited"] = 2] = "Visited";
})(State || (State = {}));
function getCommitOrder(entities) {
    const nodeState = {};
    const saveOrder = [];
    for (const node of entities) {
        nodeState[node.name] = State.Unvisited;
    }
    function visit(node) {
        if (nodeState[node.name] !== State.Unvisited)
            return;
        nodeState[node.name] = State.Visiting;
        for (const edge of node.relations) {
            if (edge.foreignKeys.length === 0)
                continue;
            const target = edge.inverseEntityMetadata;
            switch (nodeState[target.name]) {
                case undefined:
                case State.Unvisited: {
                    visit(target);
                    break;
                }
                case State.Visiting: {
                    const reversedEdge = target.relations.find((r) => r.inverseEntityMetadata === node);
                    if (reversedEdge != null) {
                        const edgeWeight = getWeight(edge);
                        const reversedEdgeWeight = getWeight(reversedEdge);
                        if (edgeWeight > reversedEdgeWeight) {
                            for (const r of target.relations) {
                                visit(r.inverseEntityMetadata);
                            }
                            nodeState[target.name] = State.Visited;
                            saveOrder.push(target);
                        }
                    }
                    break;
                }
            }
        }
        if (nodeState[node.name] !== State.Visited) {
            nodeState[node.name] = State.Visited;
            saveOrder.push(node);
        }
    }
    for (const node of entities) {
        visit(node);
    }
    return saveOrder;
}
function getWeight(relation) {
    return relation.isNullable ? 0 : 1;
}
//# sourceMappingURL=relationGraph.js.map
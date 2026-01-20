import { NodeType, GridType } from "../types";

export type AlgoStep = {
  nodes: NodeType[];
  type: 'visited' | 'open' | 'path';
};

// Generator function for A* algorithm
export function* astarGenerator(grid: GridType, startNode: NodeType, finishNode: NodeType): Generator<AlgoStep, void, unknown> {
  // Initialize start node
  startNode.distance = 0;
  startNode.gScore = 0;
  startNode.hScore = heuristic(startNode, finishNode);
  startNode.fScore = startNode.gScore + startNode.hScore;

  const openSet: NodeType[] = [startNode];
  
  // Yield start node initialization
  yield { nodes: [startNode], type: 'open' };

  while (openSet.length > 0) {
    // Sort by fScore (lowest first). If tie, pick lowest hScore (closest to end).
    openSet.sort((a, b) => a.fScore - b.fScore || a.hScore - b.hScore);
    const closestNode = openSet.shift();

    if (!closestNode) break;

    // If wall, skip
    if (closestNode.isWall) continue;

    // Handle infinite distance safety check
    if (closestNode.distance === Infinity) return;

    closestNode.isVisited = true;
    
    yield { nodes: [closestNode], type: 'visited' };

    if (closestNode === finishNode) return;

    const neighbors = getUnvisitedNeighbors(closestNode, grid);
    
    for (const neighbor of neighbors) {
      const tentativeGScore = closestNode.gScore + 1;

      if (tentativeGScore < neighbor.gScore) {
        neighbor.previousNode = closestNode;
        neighbor.gScore = tentativeGScore;
        neighbor.hScore = heuristic(neighbor, finishNode);
        neighbor.fScore = neighbor.gScore + neighbor.hScore;
        neighbor.distance = tentativeGScore;
        
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
        
        // Yield updated neighbor (added to open set or updated)
        yield { nodes: [neighbor], type: 'open' };
      }
    }
  }
}

// Manhattan distance heuristic
const heuristic = (node: NodeType, finishNode: NodeType): number => {
  return Math.abs(node.row - finishNode.row) + Math.abs(node.col - finishNode.col);
};

const getUnvisitedNeighbors = (node: NodeType, grid: GridType): NodeType[] => {
  const neighbors: NodeType[] = [];
  const { row, col } = node;

  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);

  return neighbors.filter((neighbor) => !neighbor.isVisited);
};

export const getNodesInShortestPathOrder = (finishNode: NodeType): NodeType[] => {
  const nodesInShortestPathOrder: NodeType[] = [];
  let currentNode: NodeType | null = finishNode;
  
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
};
export interface NodeType {
  row: number;
  col: number;
  isStart: boolean;
  isFinish: boolean;
  distance: number;
  isVisited: boolean;
  isWall: boolean;
  previousNode: NodeType | null;
  fScore: number; // For A* (g + h)
  gScore: number; // Cost from start
  hScore: number; // Heuristic (estimated cost to end)
}

export type GridType = NodeType[][];
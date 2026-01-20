import React from 'react';
import { NodeType } from '../types';

interface NodeProps {
  node: NodeType;
  onMouseDown: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onMouseUp: () => void;
}

const Node: React.FC<NodeProps> = ({ node, onMouseDown, onMouseEnter, onMouseUp }) => {
  const { row, col, isFinish, isStart, isWall } = node;

  // Increased size from w-6 h-6 to w-16 h-16 (64px)
  const baseClasses = "w-16 h-16 border border-slate-700 select-none inline-block align-top relative overflow-hidden transition-colors duration-200";
  
  let extraClasses = "";
  if (isFinish) {
    extraClasses = "bg-red-500";
  } else if (isStart) {
    extraClasses = "bg-green-500";
  } else if (isWall) {
    extraClasses = "node-wall";
  }

  // We intentionally do not render the costs here via React props to avoid full re-renders 
  // during the visualization loop. The Pathfinder component updates innerHTML directly.
  // However, we render initial state labels for Start/End.

  return (
    <div
      id={`node-${row}-${col}`}
      className={`${baseClasses} ${extraClasses}`}
      onMouseDown={() => onMouseDown(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseUp={onMouseUp}
    >
        {isStart && <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs z-10">Start</div>}
        {isFinish && <div className="absolute inset-0 flex items-center justify-center font-bold text-white text-xs z-10">End</div>}
    </div>
  );
};

export default Node;
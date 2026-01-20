import React, { useState, useEffect, useRef } from "react";
import Node from "./Node";
import { astarGenerator, getNodesInShortestPathOrder, AlgoStep } from "../algorithms/astar";
import { NodeType, GridType } from "../types";
import {
  GRID_ROWS,
  GRID_COLS,
  START_NODE_ROW,
  START_NODE_COL,
  FINISH_NODE_ROW,
  FINISH_NODE_COL,
  ANIMATION_SPEED_MS,
} from "../constants";

// Helper to generate the HTML content for a node with costs
const generateNodeContent = (node: NodeType) => {
    // If it's start or finish, we might want to keep the label, but we can overlay costs too.
    // For simplicity, we just overwrite with costs if they exist.
    if (node.gScore === Infinity && node.hScore === Infinity && node.fScore === Infinity) return '';

    return `
    <div class="flex flex-col h-full justify-between p-1 w-full text-slate-900 font-sans">
        <div class="flex justify-between w-full text-[10px] font-semibold leading-none">
            <span>${node.gScore === Infinity ? '∞' : node.gScore}</span>
            <span>${node.hScore === Infinity ? '∞' : node.hScore}</span>
        </div>
        <div class="text-center font-bold text-lg leading-none mt-1">${node.fScore === Infinity ? '∞' : node.fScore}</div>
    </div>
    `;
};

const createNode = (col: number, row: number): NodeType => {
  return {
    col,
    row,
    isStart: row === START_NODE_ROW && col === START_NODE_COL,
    isFinish: row === FINISH_NODE_ROW && col === FINISH_NODE_COL,
    distance: Infinity,
    isVisited: false,
    isWall: false,
    previousNode: null,
    gScore: Infinity,
    hScore: Infinity,
    fScore: Infinity,
  };
};

const getInitialGrid = (): GridType => {
  const grid: GridType = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const currentRow: NodeType[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      currentRow.push(createNode(col, row));
    }
    grid.push(currentRow);
  }
  return grid;
};

const getNewGridWithWallToggled = (
  grid: GridType,
  row: number,
  col: number
): GridType => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  if (node.isStart || node.isFinish) return grid;

  const newNode = {
    ...node,
    isWall: !node.isWall,
  };
  newGrid[row][col] = newNode;
  return newGrid;
};

const Pathfinder: React.FC = () => {
  const [grid, setGrid] = useState<GridType>([]);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  
  // Visualization State
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const generatorRef = useRef<Generator<AlgoStep, void, unknown> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setGrid(getInitialGrid());
  }, []);

  // --- Interaction Handlers ---

  const handleMouseDown = (row: number, col: number) => {
    if (isRunning || isFinished || isPaused) return; // Lock editing during run
    const newGrid = getNewGridWithWallToggled(grid, row, col);
    setGrid(newGrid);
    setMouseIsPressed(true);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!mouseIsPressed || isRunning || isFinished || isPaused) return;
    const newGrid = getNewGridWithWallToggled(grid, row, col);
    setGrid(newGrid);
  };

  const handleMouseUp = () => {
    setMouseIsPressed(false);
  };

  // --- Control Logic ---

  const initGenerator = () => {
      // Need a clean grid copy but with walls preserved
      // We also need to reset the DOM display
      resetDOMForRun();
      
      const startNode = grid[START_NODE_ROW][START_NODE_COL];
      const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
      
      // We need to reset the logical state of nodes in the grid (distance, visited, etc)
      // while keeping walls.
      // Since we are mutating the grid state objects in place during the algo run for performance,
      // we should ensure they are clean before starting.
      const cleanGrid = grid.map(row => row.map(node => ({
          ...node,
          distance: Infinity,
          isVisited: false,
          previousNode: null,
          fScore: Infinity,
          gScore: Infinity,
          hScore: Infinity,
          // Keep structural props
          row: node.row,
          col: node.col,
          isStart: node.isStart,
          isFinish: node.isFinish,
          isWall: node.isWall
      })));
      
      // Update our state reference to this clean grid so subsequent steps use it
      // Note: setGrid is async, but we pass cleanGrid to generator immediately.
      setGrid(cleanGrid);
      
      const startNodeClean = cleanGrid[START_NODE_ROW][START_NODE_COL];
      const finishNodeClean = cleanGrid[FINISH_NODE_ROW][FINISH_NODE_COL];

      generatorRef.current = astarGenerator(cleanGrid, startNodeClean, finishNodeClean);
  };

  const resetDOMForRun = () => {
    // Clear custom colors and text from previous runs
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const node = grid[row][col];
            const element = document.getElementById(`node-${row}-${col}`);
            if (element) {
                element.className = `w-16 h-16 border border-slate-700 select-none inline-block align-top relative overflow-hidden transition-colors duration-200 ${
                    node.isStart ? 'bg-green-500' : 
                    node.isFinish ? 'bg-red-500' : 
                    node.isWall ? 'node-wall' : ''
                }`;
                
                // Restore Start/End labels
                if (node.isStart) element.innerHTML = '<div class="absolute inset-0 flex items-center justify-center font-bold text-white text-xs z-10">Start</div>';
                else if (node.isFinish) element.innerHTML = '<div class="absolute inset-0 flex items-center justify-center font-bold text-white text-xs z-10">End</div>';
                else element.innerHTML = '';
            }
        }
    }
  };

  const updateNodeDOM = (node: NodeType, type: 'visited' | 'open' | 'path') => {
    const element = document.getElementById(`node-${node.row}-${node.col}`);
    if (!element) return;

    // Apply classes
    // Note: We use !important utilities or specific classes to override base styles
    let colorClass = '';
    if (type === 'visited') colorClass = 'node-visited'; // CSS animation class
    else if (type === 'open') colorClass = 'bg-green-400'; // Open set (greenish)
    else if (type === 'path') colorClass = 'node-shortest-path'; // Path animation class

    // Preserve start/finish colors if needed, or overlay them?
    // Usually visualization overrides color. 
    // But text must be visible.
    
    if (!node.isStart && !node.isFinish) {
        if (type === 'visited') {
           element.className = `w-16 h-16 border border-slate-700 select-none inline-block align-top relative overflow-hidden node-visited`;
        } else if (type === 'open') {
           element.className = `w-16 h-16 border border-slate-700 select-none inline-block align-top relative overflow-hidden bg-green-400`;
        } else if (type === 'path') {
           element.className = `w-16 h-16 border border-slate-700 select-none inline-block align-top relative overflow-hidden node-shortest-path`;
        }
    }

    // Update Content (Costs)
    // We update innerHTML to show scores.
    element.innerHTML = generateNodeContent(node);
  };

  const performStep = () => {
      if (!generatorRef.current) return;

      const result = generatorRef.current.next();
      
      if (result.done) {
          stopLoop();
          // Animation finished, draw shortest path
          const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
          // We need to find the finish node in the *current* grid state which has links
          // Since we mutated the objects in `cleanGrid` inside `initGenerator`, and updated state with `setGrid(cleanGrid)`,
          // `grid` state should be consistent if accessed correctly.
          // However, React state updates are scheduled.
          // But `generatorRef` holds the closure over the objects we are mutating.
          // So we should be able to traverse back from the finish node object used in the generator.
          
          // Actually, let's just use the `finishNode` from the grid we initialized.
          // We can't easily grab it from the generator closure.
          // But we know the coordinates.
          // The `grid` variable in this scope might be stale if `setGrid` was called.
          // But the OBJECTS are what matters. The generator mutated the objects.
          // We need those specific instances.
          
          // To be safe, we re-run `getNodesInShortestPathOrder` using the objects currently in the DOM/Memory that were mutated.
          // We can access them via the `grid` state if it was updated, OR we can rely on the fact that
          // we haven't changed the `grid` reference since `initGenerator` started (unless user clicked, which is disabled).
          
          const path = getNodesInShortestPathOrder(finishNode);
          animatePath(path);
          setIsFinished(true);
          setIsRunning(false);
          setIsPaused(false);
          return;
      }

      const step = result.value as AlgoStep;
      step.nodes.forEach(node => {
          updateNodeDOM(node, step.type);
      });
  };

  const animatePath = (path: NodeType[]) => {
      path.forEach((node, idx) => {
          setTimeout(() => {
              updateNodeDOM(node, 'path');
          }, 50 * idx);
      });
  };

  const startLoop = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
          performStep();
      }, ANIMATION_SPEED_MS);
  };

  const stopLoop = () => {
      if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
      }
  };

  const handlePlay = () => {
      if (isFinished) {
          handleReset();
          // Need to wait for reset? No, synchronous mostly.
          // Then start.
          setTimeout(() => {
            initGenerator();
            setIsRunning(true);
            startLoop();
          }, 0);
          return;
      }

      if (!isRunning && !isPaused) {
          // First start
          initGenerator();
          setIsRunning(true);
          startLoop();
      } else if (isPaused) {
          // Resume
          setIsPaused(false);
          setIsRunning(true);
          startLoop();
      }
  };

  const handlePause = () => {
      setIsPaused(true);
      setIsRunning(false);
      stopLoop();
  };

  const handleStep = () => {
      if (isFinished) return;
      
      if (!isRunning && !isPaused) {
          initGenerator();
          setIsRunning(true); // Technically running but manually
          setIsPaused(true); // Paused immediately
      }
      
      performStep();
      setIsPaused(true); // Ensure we stay in "paused" mode if we were running
      stopLoop();
      setIsRunning(false); // Update state to reflect not auto-running
  };

  const handleReset = () => {
      stopLoop();
      generatorRef.current = null;
      setIsRunning(false);
      setIsPaused(false);
      setIsFinished(false);
      
      // Reset Grid Logic
      const newGrid = getInitialGrid();
      setGrid(newGrid);
      
      // Reset DOM
      // We need to wait for React to render the new grid structure? 
      // The structure (rows/cols) is same.
      // But we need to clear the innerHTML and classes.
      // We can do this manually to be snappy.
      setTimeout(() => {
         // Force clear DOM classes manually in case React didn't catch all manual DOM manipulations
         // (React reconciliation might skip elements it thinks haven't changed props)
         for (let row = 0; row < GRID_ROWS; row++) {
             for (let col = 0; col < GRID_COLS; col++) {
                 const element = document.getElementById(`node-${row}-${col}`);
                 if (element) {
                     element.className = `w-16 h-16 border border-slate-700 select-none inline-block align-top relative overflow-hidden transition-colors duration-200`;
                     const node = newGrid[row][col];
                     if (node.isStart) {
                         element.classList.add('bg-green-500');
                         element.innerHTML = '<div class="absolute inset-0 flex items-center justify-center font-bold text-white text-xs z-10">Start</div>';
                     } else if (node.isFinish) {
                         element.classList.add('bg-red-500');
                         element.innerHTML = '<div class="absolute inset-0 flex items-center justify-center font-bold text-white text-xs z-10">End</div>';
                     } else {
                         element.innerHTML = '';
                     }
                 }
             }
         }
      }, 0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900">
      <div className="mb-6 text-center space-y-4">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          A* Pathfinding Visualizer
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Draw walls. Use controls to step through the algorithm.
          <br/>
          <span className="text-xs text-slate-500">Values: Top-Left: G (dist from start), Top-Right: H (dist to end), Center: F (G + H)</span>
        </p>
        
        <div className="flex gap-2 justify-center items-center flex-wrap bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-700">
          {!isRunning || isPaused ? (
              <button
                onClick={handlePlay}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg transition-all"
                title="Play"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </button>
          ) : (
              <button
                onClick={handlePause}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg transition-all"
                title="Pause"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
              </button>
          )}

          <button
            onClick={handleStep}
            className="px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isRunning && !isPaused}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
            </svg>
            Step
          </button>
          
          <div className="w-px h-8 bg-slate-600 mx-2"></div>
          
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-all border border-slate-600"
          >
            Reset
          </button>
        </div>

        <div className="flex gap-6 justify-center text-sm text-slate-300 mt-4">
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 border border-slate-600"></div> Start
            </div>
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 border border-slate-600"></div> End
            </div>
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[rgb(12,53,71)] border border-slate-600"></div> Wall
            </div>
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-400 border border-slate-600"></div> Open Set
            </div>
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[rgba(0,190,218,0.75)] border border-slate-600"></div> Closed Set
            </div>
            <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[rgba(255,254,106,0.75)] border border-slate-600"></div> Path
            </div>
        </div>
      </div>

      <div 
        className="grid bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-700 overflow-x-auto max-w-full"
        onMouseLeave={handleMouseUp}
      >
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((node, nodeIdx) => (
              <Node
                key={nodeIdx}
                node={node}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseUp={handleMouseUp}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pathfinder;
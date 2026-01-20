# A* Pathfinding Visualizer

A robust, interactive visualization tool for the A* pathfinding algorithm, built with React and TypeScript.

![Application Screenshot](screenshot.png)

## Features

### 🎮 Interactive Controls
- **Draw Walls**: Click and drag on the grid to create obstacles.
- **Playback Control**: Play, pause, and reset the visualization.
- **Step-Through**: Manually advance the algorithm one step at a time to understand the decision-making process.

### 📊 Real-Time Metrics
Each node displays real-time pathfinding data:
- **F-Cost (Center)**: The total cost function `F = G + H`.
- **G-Cost (Top-Left)**: The distance from the start node.
- **H-Cost (Top-Right)**: The heuristic estimated distance to the target.

### 🎨 Visual Feedback
- **Open Set (Green)**: Nodes currently being evaluated.
- **Closed Set (Teal)**: Nodes that have been visited.
- **Shortest Path (Yellow)**: The optimal path found by the algorithm.
- **Walls (Dark Blue)**: Impassable terrain.

## Technologies Used

- **React**: Component-based UI structure.
- **Tailwind CSS**: Modern, utility-first styling.
- **TypeScript**: Type-safe logic for the A* algorithm.
- **Generator Functions**: Used to create a pausable and controllable algorithm loop.

## Algorithm Implementation

The project uses a custom implementation of A* that yields `AlgoStep` objects via a generator function (`astarGenerator`). This allows the React component to maintain control over the execution flow, enabling the "Step" and "Pause" features without complex state management or `setTimeout` chains inside the algorithm itself.

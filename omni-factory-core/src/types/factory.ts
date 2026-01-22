/**
 * FACTORY GRAPH TYPES
 * Distinctions between User Intent and Physical Reality.
 */

// -- User Intent (Graph Topology) --

export interface FactoryNode {
  id: string; // UUID
  position: { x: number; y: number };
  recipeId: string;
  clockSpeed: number; // 1.0 = 100%, 2.5 = 250%
  machineTier?: number; // e.g., Mk.1 vs Mk.2 Miner

  // User overrides/constraints
  targetOutput?: number; // "I want 10/min from this specific node"
  priority?: number; // For priority merging logic
}

export interface FactoryEdge {
  id: string; // UUID
  sourceNodeId: string;
  sourceHandle: string; // itemSlug
  targetNodeId: string;
  targetHandle: string; // itemSlug

  // Physical Limit of the transport medium (Belt/Pipe)
  limitRate?: number; // e.g., 60, 120, 300, 600, 1200

  // Metadata for Visualization
  data?: {
    isRecycled?: boolean;
  };
}

// -- Simulation Reality (Computed Results) --

export interface SimulationEdgeResult {
  edgeId: string;
  flowRate: number; // The actual calculated flow
  isBottleneck: boolean; // True if flowRate >= limitRate
}

export interface SimulationNodeResult {
  nodeId: string;
  actualRunRate: number; // 0.0 to clockSpeed (Efficiency)
  powerDraw: number; // MW
  efficiency: number; // percentage (0-100)
  warnings: string[]; // e.g., "Missing Input: Coal"
}

export interface SimulationResult {
  nodes: Record<string, SimulationNodeResult>;
  edges: Record<string, SimulationEdgeResult>;
  totalPower: number; // MW
  totalPoints: number; // Awesome Sink points/min
  solved: boolean;
  errors: string[];
}

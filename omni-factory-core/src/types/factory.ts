/**
 * FICSIT Factory Types
 * Strictly typed interfaces for the Factory Core.
 */

// -- Primitives --

export interface RecipeItem {
  itemSlug: string;
  amount: number; // Items per minute or per cycle, context dependent
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeItem[];
  products: RecipeItem[];
  duration: number; // Seconds per cycle
  producedIn: string[]; // Machine slugs (e.g., 'build_constructor')
}

// -- Graph Structure --

export interface FactoryNode {
  id: string; // UUID
  position: {
    x: number;
    y: number;
  };
  recipeId: string;
  clockSpeed: number; // 1.0 = 100%, 2.5 = 250%
  machineTier?: number; // Optional tier for belts/pipes logic
}

export interface FactoryEdge {
  id: string; // UUID for the edge itself
  sourceNodeId: string;
  targetNodeId: string;
  itemSlug: string;
  flowRate: number; // Items per minute
}

export interface FactoryGraph {
  nodes: FactoryNode[];
  edges: FactoryEdge[];
}

export interface FactorySolution {
  solvedNodes: FactoryNode[]; // Nodes with updated potential data (e.g. efficiency)
  solvedEdges: FactoryEdge[]; // Edges with calculated flow rates
  unresolvedDependencies: string[];
}

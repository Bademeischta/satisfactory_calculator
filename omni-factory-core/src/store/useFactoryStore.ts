import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { FactoryNode, FactoryEdge, SimulationResult } from '@/types/factory';

interface FactoryState {
  // User Intent
  nodes: FactoryNode[];
  edges: FactoryEdge[];

  // Simulation Reality
  simulation: SimulationResult | null;

  // Actions
  addNode: (recipeId: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  connectNodes: (sourceId: string, targetId: string, itemSlug: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: Partial<FactoryNode>) => void;

  // Set Simulation Result
  setSimulationResult: (result: SimulationResult) => void;
}

export const useFactoryStore = create<FactoryState>((set) => ({
  nodes: [],
  edges: [],
  simulation: null,

  setSimulationResult: (result) => {
    set({ simulation: result });
  },

  updateNodeData: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, ...data } : node)),
    }));
  },

  addNode: (recipeId, position) => {
    set((state) => ({
      nodes: [
        ...state.nodes,
        {
          id: uuidv4(),
          recipeId,
          position,
          clockSpeed: 1.0,
        },
      ],
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.sourceNodeId !== id && edge.targetNodeId !== id
      ),
    }));
  },

  connectNodes: (sourceId, targetId, itemSlug) => {
    set((state) => ({
      edges: [
        ...state.edges,
        {
          id: uuidv4(),
          sourceNodeId: sourceId,
          targetNodeId: targetId,
          itemSlug,
          flowRate: 0, // Initial flow rate is 0, to be calculated by solver
        },
      ],
    }));
  },

  updateNodePosition: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, position } : node)),
    }));
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { FactoryNode, FactoryEdge, SimulationResult } from '@/types/factory';
import { getLayoutedElements } from '@/lib/autoLayout';
import { decompressState } from '@/lib/compression';

interface FactoryState {
  // User Intent
  nodes: FactoryNode[];
  edges: FactoryEdge[];

  // Simulation Reality
  simulation: SimulationResult | null;
  selectedNodeId: string | null;

  // Actions
  addNode: (recipeId: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  clearFactory: () => void;
  selectNode: (id: string | null) => void;
  connectNodes: (sourceId: string, targetId: string, itemSlug: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: Partial<FactoryNode>) => void;
  setFactoryGraph: (nodes: FactoryNode[], edges: FactoryEdge[]) => void;
  layoutNodes: () => void;
  importStateFromUrl: (urlSearch: string) => boolean;

  // Set Simulation Result
  setSimulationResult: (result: SimulationResult) => void;
}

export const useFactoryStore = create<FactoryState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      simulation: null,
      selectedNodeId: null,

      selectNode: (id) => {
        set({ selectedNodeId: id });
      },

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

      clearFactory: () => {
        set({ nodes: [], edges: [], selectedNodeId: null, simulation: null });
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

      setFactoryGraph: (nodes, edges) => {
        set({ nodes, edges, selectedNodeId: null, simulation: null });
      },

      layoutNodes: () => {
        const { nodes, edges } = get();
        const layouted = getLayoutedElements(nodes, edges);
        set({ nodes: [...layouted.nodes], edges: [...layouted.edges] });
      },

      importStateFromUrl: (urlSearch: string) => {
        const params = new URLSearchParams(urlSearch);
        const stateStr = params.get('state');
        if (stateStr) {
          const result = decompressState(stateStr);
          if (result) {
            set({ nodes: result.nodes, edges: result.edges, selectedNodeId: null, simulation: null });
            return true;
          }
        }
        return false;
      },
    }),
    {
      name: 'ficsit-factory-v1',
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    }
  )
);

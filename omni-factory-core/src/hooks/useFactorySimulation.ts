import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useFactoryStore } from '@/store/useFactoryStore';
import { solveFactorySimulation } from '@/lib/solver/graphSolver';
import { SimulationResult } from '@/types/factory';

export function useFactorySimulation() {
  const nodes = useFactoryStore((state) => state.nodes);
  const edges = useFactoryStore((state) => state.edges);
  const setSimulationResult = useFactoryStore((state) => state.setSimulationResult);

  // Debounce inputs to prevent UI locking during heavy edits
  const [debouncedNodes] = useDebounce(nodes, 500);
  const [debouncedEdges] = useDebounce(edges, 500);

  const [isSolving, setIsSolving] = useState(false);

  useEffect(() => {
    setIsSolving(true);

    // In a real production app, we would use a Web Worker here.
    // For now, we use a timeout to allow the UI thread to breathe before solving.
    const timer = setTimeout(() => {
        try {
            const result: SimulationResult = solveFactorySimulation(debouncedNodes, debouncedEdges);
            setSimulationResult(result);
        } catch (e) {
            // console.error("Solver Error:", e);
        } finally {
            setIsSolving(false);
        }
    }, 10);

    return () => clearTimeout(timer);
  }, [debouncedNodes, debouncedEdges, setSimulationResult]);

  return { isSolving };
}

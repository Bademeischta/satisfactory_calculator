import { useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useFactoryStore } from '@/store/useFactoryStore';
import { solveFactoryGraph } from '@/lib/solver/graphSolver';

export function useSolver() {
  const nodes = useFactoryStore((state) => state.nodes);
  const edges = useFactoryStore((state) => state.edges);
  const setEdgeFlowRates = useFactoryStore((state) => state.setEdgeFlowRates);

  // Debounce the inputs to the solver to avoid thrashing
  const [debouncedNodes] = useDebounce(nodes, 500);
  const [debouncedEdges] = useDebounce(edges, 500);

  useEffect(() => {
    // Run the solver
    const solution = solveFactoryGraph(debouncedNodes, debouncedEdges);

    // Extract flow rates
    const flowRates: Record<string, number> = {};
    solution.solvedEdges.forEach((edge) => {
      flowRates[edge.id] = edge.flowRate;
    });

    // Update the store
    setEdgeFlowRates(flowRates);

    // Debug log to verify solver is running (in dev)
    if (process.env.NODE_ENV === 'development') {
       // console.log('Solver ran:', flowRates);
    }
  }, [debouncedNodes, debouncedEdges, setEdgeFlowRates]);
}

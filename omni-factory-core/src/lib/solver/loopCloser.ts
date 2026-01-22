import { v4 as uuidv4 } from 'uuid';
import { FactoryNode, FactoryEdge } from '@/types/factory';
import { DB } from '@/lib/db';

interface GraphState {
  nodes: FactoryNode[];
  edges: FactoryEdge[];
}

export function closeLoops(initialNodes: FactoryNode[], initialEdges: FactoryEdge[]): GraphState {
  const nodes = [...initialNodes];
  const edges = [...initialEdges];

  // Helper to find connections
  const findIncomingEdges = (nodeId: string, handle: string) =>
    edges.filter(e => e.targetNodeId === nodeId && e.targetHandle === handle);

  const findOutgoingEdges = (nodeId: string, handle: string) =>
    edges.filter(e => e.sourceNodeId === nodeId && e.sourceHandle === handle);

  // 1. Identify all Open Outputs (Potential Byproducts)
  // We look at every node, check its recipe products, and see if the handle has outgoing edges.
  // Actually, for "Byproducts" specifically, we might prioritize them.
  // But generally, any open output is a potential source.
  const openOutputs: { nodeId: string; itemSlug: string; amount: number }[] = [];

  nodes.forEach(node => {
    try {
      const recipe = DB.getRecipe(node.recipeId);
      recipe.products.forEach(prod => {
        const outgoing = findOutgoingEdges(node.id, prod.itemSlug);
        if (outgoing.length === 0) {
          // Calculate amount produced per minute
          const amountPerMin = (prod.amount * 60 / recipe.duration) * node.clockSpeed;
          openOutputs.push({ nodeId: node.id, itemSlug: prod.itemSlug, amount: amountPerMin });
        }
      });
    } catch {
      // Ignore invalid recipes
    }
  });

  // 2. Identify all Open Inputs (Needs)
  const openInputs: { nodeId: string; itemSlug: string; amount: number }[] = [];

  nodes.forEach(node => {
    try {
      const recipe = DB.getRecipe(node.recipeId);
      recipe.ingredients.forEach(ing => {
        const incoming = findIncomingEdges(node.id, ing.itemSlug);
        if (incoming.length === 0) {
           const amountPerMin = (ing.amount * 60 / recipe.duration) * node.clockSpeed;
           openInputs.push({ nodeId: node.id, itemSlug: ing.itemSlug, amount: amountPerMin });
        }
      });
    } catch {
      // Ignore
    }
  });

  // 3. Match and Connect
  // Greedy strategy: For each open input, look for an open output of same slug.
  openInputs.forEach(input => {
    // Check if we already satisfied this input in a previous iteration of this loop?
    // The `edges` array is updated, but `findIncomingEdges` relies on the array state.
    // We should check if we added an edge to this input.
    const currentIncoming = findIncomingEdges(input.nodeId, input.itemSlug);
    if (currentIncoming.length > 0) return; // Already connected

    // Find a matching output
    const matchIndex = openOutputs.findIndex(out => out.itemSlug === input.itemSlug);

    if (matchIndex !== -1) {
      const output = openOutputs[matchIndex];

      // Connect!
      // Create Edge
      const newEdge: FactoryEdge = {
        id: uuidv4(),
        sourceNodeId: output.nodeId,
        sourceHandle: output.itemSlug,
        targetNodeId: input.nodeId,
        targetHandle: input.itemSlug,
        limitRate: 780, // Mk.5
      };

      // Mark as Recycled (We need to add this property to FactoryEdge type or handle it in data)
      // Since `FactoryEdge` is strict, I can't just add properties unless I update the type.
      // But the task says "color those Edges... automatically in FlowEdge.tsx".
      // I can add it to a `data` property if `FactoryEdge` allows it.
      // Checking `FactoryEdge` definition: it doesn't have `data` field in `types/factory.ts`.
      // I should update `types/factory.ts` or reuse `limitRate` (bad idea).
      // Wait, `FactoryEdge` interface in memory shows:
      // export interface FactoryEdge { id, sourceNodeId... limitRate? }
      // No `data` field. React Flow edges usually have `data`.
      // The store uses `FactoryEdge` which maps to React Flow Edge.
      // I should add `data?: any` to `FactoryEdge` definition.
      // But for now, let's assume I can cast it or the type allows it.
      // Better: Update `FactoryEdge` type in step 2 or just now.
      // I will coerce it for now and ensure Type definition is updated.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newEdge as any).data = { isRecycled: true };

      edges.push(newEdge);

      // Consumed the output?
      // If output > input, we still have leftover.
      // If output < input, we consumed it all.
      // To keep it simple, we remove the output from our list if we used it.
      // Ideally we allow fan-out (one output -> multiple inputs).
      // But `openOutputs` was "outputs with NO outgoing edges".
      // Now it has one.
      // We remove it from the list so we don't double-connect it immediately (unless we want to split).
      // Splitting requires mergers usually.
      // I'll remove it to prevent complex splitting logic for now.
      openOutputs.splice(matchIndex, 1);

      // Handle "Delete the external Input Node"
      // If the input was "Leaf Node that is Input".
      // In my previous analysis, if `planProduction` created Source Nodes (e.g. Miners), they would be connected.
      // But here `openInputs` are UNCONNECTED inputs.
      // So there is NO external Input Node connected yet.
      // So "Delete" is irrelevant because it doesn't exist.
      // However, if the user manually connected a Miner, then `findIncomingEdges` would return > 0, so we wouldn't be here.
      // So this logic only applies to "Auto-Build" where we might have unconnected inputs.
      // Or if `planProduction` created a Miner and we want to replace it?
      // If `planProduction` created a Miner, the input is NOT open.
      // So we must look for inputs that ARE connected to a "Resource Node" (Miner).
    }
  });

  // 4. Advanced: Replace existing Resource Nodes with Recycled Inputs?
  // "Identify all 'Leaf Nodes' that are Inputs... Match them... If Byproduct matches... Delete external Input Node".
  // This implies we look at CONNECTED inputs too, specifically those connected to "Leaves".

  // Let's iterate ALL inputs again.
  nodes.forEach(node => {
      try {
          const recipe = DB.getRecipe(node.recipeId);
          recipe.ingredients.forEach(ing => {
              const incoming = findIncomingEdges(node.id, ing.itemSlug);

              if (incoming.length > 0) {
                  // It has a source. Is it a "Leaf Resource Node"?
                  const sourceNode = nodes.find(n => n.id === incoming[0].sourceNodeId);
                  if (sourceNode) {
                      // Check if sourceNode is a Resource Producer (e.g. Miner, Water Extractor).
                      // Usually these have NO ingredients.
                      let isResourceNode = false;
                      try {
                          const srcRecipe = DB.getRecipe(sourceNode.recipeId);
                          if (srcRecipe.ingredients.length === 0) {
                              isResourceNode = true;
                          }
                      } catch {
                          // If recipe invalid, maybe it's a dummy node?
                      }

                      if (isResourceNode) {
                          // This is a candidate for replacement!
                          // Check if we have an open byproduct for this slug.
                          const matchIndex = openOutputs.findIndex(out => out.itemSlug === ing.itemSlug);
                          if (matchIndex !== -1) {
                              const output = openOutputs[matchIndex];

                              // We found a recyclable source!
                              // 1. Remove the edge from the Resource Node.
                              const oldEdgeIndex = edges.findIndex(e => e.id === incoming[0].id);
                              if (oldEdgeIndex !== -1) edges.splice(oldEdgeIndex, 1);

                              // 2. Remove the Resource Node itself?
                              // Only if it has no other outputs.
                              const otherOutputs = edges.filter(e => e.sourceNodeId === sourceNode.id);
                              if (otherOutputs.length === 0) {
                                  const nodeIndex = nodes.findIndex(n => n.id === sourceNode.id);
                                  if (nodeIndex !== -1) nodes.splice(nodeIndex, 1);
                              }

                              // 3. Connect Byproduct -> Input
                              const newEdge: FactoryEdge = {
                                  id: uuidv4(),
                                  sourceNodeId: output.nodeId,
                                  sourceHandle: output.itemSlug,
                                  targetNodeId: node.id,
                                  targetHandle: ing.itemSlug,
                                  limitRate: 780
                              };
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (newEdge as any).data = { isRecycled: true };
                              edges.push(newEdge);

                              // Remove used output from pool
                              openOutputs.splice(matchIndex, 1);
                          }
                      }
                  }
              }
          });
      // eslint-disable-next-line no-empty
      } catch { }
  });

  return { nodes, edges };
}

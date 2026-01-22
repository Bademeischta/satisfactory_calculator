/* eslint-disable @typescript-eslint/no-explicit-any */
import { FactoryNode, FactoryEdge, FactorySolution } from '@/types/factory';
import solver from 'javascript-lp-solver';
import { DB } from '@/lib/db';

/**
 * Solves the factory graph using Linear Programming (Simplex Method).
 */
export function solveFactoryGraph(nodes: FactoryNode[], edges: FactoryEdge[]): FactorySolution {
  if (nodes.length === 0) {
    return { solvedNodes: [], solvedEdges: [], unresolvedDependencies: [] };
  }

  // 1. Setup the Model
  const model: any = {
    optimize: 'total_utilization',
    opType: 'max',
    constraints: {},
    variables: {},
  };

  // 2. Build Variables (Nodes)
  // Each node has a variable representing its utilization multiplier (0.0 to ClockSpeed).
  nodes.forEach((node) => {
    try {
      // Just check existence
      DB.getRecipe(node.recipeId);
    } catch {
      return;
    }

    // The variable for this node. Let's call it by its UUID.
    // It contributes 1 to the 'total_utilization' objective.
    model.variables[node.id] = {
      total_utilization: 1,
      // The node is capped by its clock speed.
      // We implement this as a constraint specific to this node: node_id_limit <= ClockSpeed
      [`${node.id}_limit`]: 1,
    };

    // Constraint for the node limit
    model.constraints[`${node.id}_limit`] = { max: node.clockSpeed };
  });

  // 3. Build Constraints (Edges)
  // Each edge represents a flow of items from Source to Target.
  // We need to enforce: Source Production >= Target Consumption
  // Actually, in LP, we balance the flow at the connection.
  // Or simpler: Total Output of SourceItem from Node A >= Sum of Inputs of TargetNodes.
  // But our graph is explicit: Edge connects specific ports.
  // So for each edge E (Source -> Target):
  //   SourceNode * ProductionRate >= TargetNode * ConsumptionRate
  //   => SourceNode * ProductionRate - TargetNode * ConsumptionRate >= 0

  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
    const targetNode = nodes.find((n) => n.id === edge.targetNodeId);

    if (!sourceNode || !targetNode) return;

    let sourceRecipe;
    let targetRecipe;
    try {
      sourceRecipe = DB.getRecipe(sourceNode.recipeId);
      targetRecipe = DB.getRecipe(targetNode.recipeId);
    } catch {
      return;
    }

    // Find the rates for the specific itemSlug
    const product = sourceRecipe.products.find((p) => p.itemSlug === edge.itemSlug);
    const ingredient = targetRecipe.ingredients.find((i) => i.itemSlug === edge.itemSlug);

    if (product && ingredient) {
      // Constraint: Production - Consumption >= 0
      // We add a constraint named after the edge.
      const constraintName = `edge_${edge.id}_balance`;

      model.constraints[constraintName] = { min: 0 };

      // Update source variable contribution
      if (!model.variables[sourceNode.id]) model.variables[sourceNode.id] = {};
      model.variables[sourceNode.id][constraintName] = product.amount; // Positive contribution

      // Update target variable contribution
      if (!model.variables[targetNode.id]) model.variables[targetNode.id] = {};
      model.variables[targetNode.id][constraintName] = -ingredient.amount; // Negative contribution (demand)
    }
  });

  // 4. Solve
  const results = solver.Solve(model);

  // 5. Map Results to Solution
  // The results object contains values for variables (node IDs).
  // If a variable is missing, it means 0.

  const solvedEdges: FactoryEdge[] = edges.map((edge) => {
    // Flow Rate on edge = Target Node RunRate * Target Consumption Rate
    // (This represents how much is actually flowing to satisfy the target)
    // Or should it be Source Output? In a balanced manifold, they meet.
    // If Source produces 100 and Target takes 30, Flow is 30.
    // If Source produces 20 and Target takes 30, Flow is 20.
    // The LP ensures Supply >= Demand. But it doesn't strictly set the flow variable.
    // However, conceptually, the flow is determined by the downstream demand usually, unless supply constrained.
    // Let's define Flow Rate = Target Consumption * Target Utilization.
    // This shows how much the target is actually pulling.

    const targetNode = nodes.find((n) => n.id === edge.targetNodeId);
    if (!targetNode) return { ...edge, flowRate: 0 };

    let targetRecipe;
    try {
      targetRecipe = DB.getRecipe(targetNode.recipeId);
    } catch {
      return { ...edge, flowRate: 0 };
    }
    const ingredient = targetRecipe?.ingredients.find((i) => i.itemSlug === edge.itemSlug);

    const utilization = results[targetNode.id] || 0;

    // Check if utilization is a number (it should be)
    const runRate = typeof utilization === 'number' ? utilization : 0;

    const flowRate = runRate * (ingredient?.amount || 0);

    return {
      ...edge,
      flowRate,
    };
  });

  // We can also update nodes with their actual efficiency if we wanted,
  // but the prompt asked to return flow rates map (implicitly via FactorySolution edge updates).

  return {
    solvedNodes: nodes, // We could attach efficiency here
    solvedEdges,
    unresolvedDependencies: [], // Todo
  };
}

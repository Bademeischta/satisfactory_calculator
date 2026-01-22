import { FactoryNode, FactoryEdge, SimulationResult } from '@/types/factory';
import solver from 'javascript-lp-solver';
import { DB } from '@/lib/db';
import { LPModelBuilder, calculatePower } from './LPModelBuilder';

export function solveFactorySimulation(
  nodes: FactoryNode[],
  edges: FactoryEdge[]
): SimulationResult {
  const builder = new LPModelBuilder(nodes, edges);

  // 1. Build Model
  const model = builder.build('MAX_EFFICIENCY');

  // 2. Solve
  const lpResult = solver.Solve(model);

  // 3. Map Results
  const result: SimulationResult = {
    nodes: {},
    edges: {},
    totalPower: 0,
    totalPoints: 0,
    solved: lpResult.feasible,
    errors: [],
  };

  // Map Node Results
  nodes.forEach(node => {
    // Run Rate (0.0 - ClockSpeed)
    const runRate = lpResult[node.id] || 0;

    // Calculate Power
    let baseMW = 4; // Default
    try {
        const recipe = DB.getRecipe(node.recipeId);
        if (recipe.producedIn.length > 0) {
            const building = DB.getBuilding(recipe.producedIn[0]);
            baseMW = building.powerConsumption;
        }
    } catch { /* ignore */ }

    // Scale power by actual run rate vs clock speed?
    // Physical Reality: Machine draws power based on Clock Speed setting, NOT utilization.
    // Even if it's idle (starved), it draws standby power?
    // Satisfactory 1.0: Idle machines draw 0.1MW (negligible) or full power?
    // Actually, they draw power while running. If runRate < Clock, it means it's cycling on/off.
    // Average Power = Power(Clock) * (RunRate / Clock)

    const maxPower = calculatePower(baseMW, node.clockSpeed);
    const utilization = node.clockSpeed > 0 ? (runRate / node.clockSpeed) : 0;
    const avgPower = maxPower * utilization;

    result.totalPower += avgPower;

    result.nodes[node.id] = {
      nodeId: node.id,
      actualRunRate: runRate,
      efficiency: utilization * 100,
      powerDraw: avgPower,
      warnings: [],
    };

    // Warning Checks
    if (utilization < 0.01 && node.clockSpeed > 0) {
        result.nodes[node.id].warnings.push('Idle');
    }
  });

  // Map Edge Results
  edges.forEach(edge => {
    const flow = lpResult[edge.id] || 0;
    const limit = edge.limitRate || 780; // Default Mk.5

    result.edges[edge.id] = {
      edgeId: edge.id,
      flowRate: flow,
      isBottleneck: flow >= (limit - 0.01),
    };
  });

  return result;
}

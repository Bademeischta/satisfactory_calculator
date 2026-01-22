/* eslint-disable @typescript-eslint/no-explicit-any */
import { FactoryNode, FactoryEdge } from '@/types/factory';
import { DB } from '@/lib/db';

/**
 * UTILITY: Non-Linear Power Calculation
 * Formula: MW = Base * (Clock ^ 1.321928)
 */
export function calculatePower(baseMW: number, clockSpeed: number, exponent = 1.321928): number {
  if (clockSpeed === 0) return 0;
  // clockSpeed is 0.0 - 2.5
  return baseMW * (clockSpeed ** exponent);
}

/**
 * LP MODEL BUILDER
 * Translates Factory Graph -> Linear Programming Model
 */
export class LPModelBuilder {
  private model: any;

  private nodes: FactoryNode[];

  private edges: FactoryEdge[];

  constructor(nodes: FactoryNode[], edges: FactoryEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.model = {
      optimize: 'total_value',
      opType: 'max',
      constraints: {},
      variables: {},
    };
  }

  public build(objectiveMode: 'MAX_EFFICIENCY' | 'TARGET_OUTPUT' = 'MAX_EFFICIENCY'): any {
    this.buildNodeVariables();
    this.buildEdgeConstraints();
    this.buildObjective(objectiveMode);
    return this.model;
  }

  /**
   * 1. NODE VARIABLES
   * Each node has a 'run_rate' variable (0 to ClockSpeed).
   *
   * Additionally, we can add 'Power' as a cost if we want to minimize it.
   */
  private buildNodeVariables() {
    this.nodes.forEach((node) => {
      try {
        // Just verify existence
        DB.getRecipe(node.recipeId);
      } catch {
        return; // Skip invalid nodes
      }

      // Variable Name: node_{UUID}
      // Represents the "Cycle Multiplier".
      // If run_rate = 1.0, machine runs at 100% base speed.
      // Max is node.clockSpeed.

      this.model.variables[node.id] = {
        // Base value: Running the machine adds to total production
        // We will refine this in buildObjective
        [`node_${node.id}_limit`]: 1,
      };

      // Constraint: Can't run faster than clock speed
      this.model.constraints[`node_${node.id}_limit`] = { max: node.clockSpeed };
    });
  }

  /**
   * 2. EDGE CONSTRAINTS (Kirchhoff / Flow Balance)
   *
   * Ideally, we model Flow on Edges as variables: x_ij.
   * Node Balance:
   *   Sum(Input Flows) * Efficiency = Internal Processing
   *   Internal Processing = Sum(Output Flows)
   *
   * However, `javascript-lp-solver` is simpler. It sums variables contribution to named constraints.
   *
   * Strategy:
   * We treat the Edge Flow as a consequence of the Source Node's output.
   * OR we define explicit Flow variables if we want to handle Splitters strictly.
   *
   * STRICT MODEL:
   * Variables:
   *   - Node_RunRate (for each machine)
   *   - Edge_Flow (for each belt)
   *
   * Constraints:
   *   - Edge Capacity: Edge_Flow <= Limit
   *   - Source Balance: Node_RunRate * ProductRate >= Sum(Edge_Flows_Out)
   *   - Target Balance: Sum(Edge_Flows_In) >= Node_RunRate * IngredientRate
   *
   * This allows "Backpressure" (Source can run faster than Edge takes, but it's wasted/stopped)
   * and "Starvation" (Target runs slower if Input is low).
   */
  private buildEdgeConstraints() {
    // We need explicit variables for Edges to handle capacity limits and splitting logic properly.
    this.edges.forEach(edge => {
      // Variable: edge_{UUID} represents items/min flowing on this belt.
      this.model.variables[edge.id] = {
        [`edge_${edge.id}_capacity`]: 1,
        [`balance_source_${edge.sourceNodeId}_${edge.sourceHandle}`]: 1, // Drag from source
        [`balance_target_${edge.targetNodeId}_${edge.targetHandle}`]: 1, // Push to target
        // Cost: Transporting items is effectively free, but we might add tiny cost to prefer shorter paths?
        // Or "Priority Merge": Recycled water edges have LOWER cost (higher priority)?
        // Let's assume standard edges have cost 0.
        // If we want Priority, we add a weight to the Objective.
      };

      // Edge Capacity Constraint
      const limit = edge.limitRate || 780; // Default Mk.5
      this.model.constraints[`edge_${edge.id}_capacity`] = { max: limit };
    });

    // Connect Nodes to Edges
    this.nodes.forEach(node => {
        let recipe;
        try {
            recipe = DB.getRecipe(node.recipeId);
        } catch { return; }

        // OUTPUTS (Source Balance)
        // Node produces X items/min.
        // Constraint: Production >= Sum(Edge Flows)
        // => Production - Sum(Edge Flows) >= 0
        recipe.products.forEach(prod => {
            const constraintName = `balance_source_${node.id}_${prod.itemSlug}`;
            // If node runs at 1.0, it produces prod.amount
            this.model.variables[node.id][constraintName] = -prod.amount; // Production is "Negative Drag" on the constraint?
            // Wait. Standard form: sum(vars) <= max or >= min.

            // Let's use: Sum(EdgeFlows) <= NodeProduction
            // => Sum(EdgeFlows) - NodeProduction <= 0
            // Edge variable contributes +1 to Sum.
            // Node variable contributes -prod.amount (it relaxes the constraint).
            // Constraint Max: 0.

            this.model.constraints[constraintName] = { max: 0 };
        });

        // INPUTS (Target Balance)
        // Node consumes X items/min.
        // Constraint: Sum(Edge Flows) >= Consumption
        // => Sum(Edge Flows) - Consumption >= 0
        recipe.ingredients.forEach(ing => {
            const constraintName = `balance_target_${node.id}_${ing.itemSlug}`;

            // Edge variable contributes +1 to Sum (already defined above in edge loop).
            // Node variable contributes -ing.amount (it increases Demand).
            this.model.variables[node.id][constraintName] = -ing.amount;

            // Constraint Min: 0 (Supply must meet Demand)
            // Wait, in LP: Supply - Demand >= 0.
            // Edge (+1) is Supply. Node (-Amount) is Demand.
            // Result >= 0.
            this.model.constraints[constraintName] = { min: 0 };
        });
    });
  }

  /**
   * 3. OBJECTIVE FUNCTION
   */
  private buildObjective(mode: 'MAX_EFFICIENCY' | 'TARGET_OUTPUT') {
      if (mode === 'MAX_EFFICIENCY') {
          // Maximize total run rates (utilization)
          // Prioritize Sink Points for end products?
          this.nodes.forEach(node => {
               this.model.variables[node.id].total_value = 1; // Simple utilization max
          });
      } else {
          // Target Output logic would go here (minimize inputs while meeting target)
          // For now, default to Efficiency.
          this.nodes.forEach(node => {
               this.model.variables[node.id].total_value = 1;
          });
      }
  }
}

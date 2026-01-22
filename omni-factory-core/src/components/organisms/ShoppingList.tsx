import React, { useMemo } from 'react';
import { X, ShoppingCart, Zap, Package } from 'lucide-react';
import { useFactoryStore } from '@/store/useFactoryStore';
import { DB } from '@/lib/db';

interface ShoppingListProps {
  onClose: () => void;
}

export function ShoppingList({ onClose }: ShoppingListProps) {
  const nodes = useFactoryStore((state) => state.nodes);
  const edges = useFactoryStore((state) => state.edges);
  const simulation = useFactoryStore((state) => state.simulation);

  // Calculate BOM
  const bom = useMemo(() => {
    const materials = new Map<string, number>();
    let totalPower = 0;
    const machines = new Map<string, number>();

    nodes.forEach(node => {
      // 1. Determine Machine Count
      let machineCount = 1;

      try {
        const recipe = DB.getRecipe(node.recipeId);

        // Calculate Total Output Flow required
        // We look at outgoing edges for the main product?
        // Actually, we should look at ALL outgoing edges flow sum?
        // Or simpler: Use simulation result if available.

        let requiredFlow = 0;
        const simNode = simulation?.nodes[node.id];

        if (simNode) {
            // If simulation exists, we can deduce required flow from Actual Run Rate?
            // simNode.actualRunRate is multiplier (0 to clockSpeed).
            // But that is "Actual". If we are bottlenecked, we might need MORE machines but are running less?
            // No, "Shopping List" implies "What do I need to build to achieve the PLAN".
            // The PLAN is the Graph Intent + Target Output.
            // But usually the user wants to support the FLOW that is happening.
            // Let's use the sum of outgoing edges flowRate.
            // Filter edges where source is this node.
            const outgoing = edges.filter(e => e.sourceNodeId === node.id);
            // We need to normalize to "Recipe Cycles".
            // Since recipe can produce multiple products, summing their rates might be tricky if ratios differ.
            // Robust way: Pick the FIRST product.
            if (recipe.products.length > 0) {
                const mainProduct = recipe.products[0];
                const mainProductEdges = outgoing.filter(e => e.sourceHandle === mainProduct.itemSlug);
                const totalOut = mainProductEdges.reduce((acc, e) => acc + (e.flowRate || 0), 0);

                requiredFlow = totalOut;

                // If totalOut is 0 (e.g. not connected yet), fall back to node.clockSpeed * standard?
                // If I just placed a node, I want to build 1 machine.
                if (requiredFlow === 0) {
                     // Assume 1 machine running at set clock speed
                     machineCount = 1;
                } else {
                    const standardRate = (mainProduct.amount * 60) / recipe.duration;
                    // Modified by clock speed?
                    // Machine Count = ceil(Required / (Standard * Clock))
                    // If user sets clock to 2.0, each machine does 2x.
                    machineCount = Math.ceil(requiredFlow / (standardRate * node.clockSpeed));
                }
            }
        } else {
            // No simulation, assume 1 machine
            machineCount = 1;
        }

        // 2. Add Building Costs
        const buildings = recipe.producedIn; // Array of slugs
        const buildingSlug = buildings[0]; // Assume first
        const costs = DB.getBuildCost(buildingSlug);

        costs.forEach(c => {
            const current = materials.get(c.itemSlug) || 0;
            materials.set(c.itemSlug, current + (c.amount * machineCount));
        });

        // Track Machine Counts
        const buildingMeta = DB.getBuilding(buildingSlug);
        const currentCount = machines.get(buildingMeta.name) || 0;
        machines.set(buildingMeta.name, currentCount + machineCount);

        // 3. Power
        // MW = Base * (Clock)^1.32... * MachineCount
        // Wait, power is for RUNNING machines.
        // If we build 4 machines, but only use 3.5, peak power is 4 * max?
        // Let's sum max power.
        const clockMult = node.clockSpeed;
        const powerPerMachine = buildingMeta.powerConsumption.baseMW * (clockMult ** buildingMeta.powerConsumption.exponent);
        totalPower += powerPerMachine * machineCount;

      } catch {
          // Ignore invalid nodes
      }
    });

    return { materials, machines, totalPower };
  }, [nodes, edges, simulation]);

  // Convert map to array for display
  const materialList = Array.from(bom.materials.entries()).map(([slug, count]) => {
      try {
          return { ...DB.getItem(slug), count };
      } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { name: slug, count, slug, iconPath: '' } as any;
      }
  }).sort((a, b) => b.count - a.count);

  const machineList = Array.from(bom.machines.entries()).map(([name, count]) => ({ name, count }));

  return (
    <div className="fixed top-20 right-4 w-80 bg-[#1e1e1e] border border-ficsit-orange rounded-lg shadow-2xl text-white flex flex-col z-40 max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#2a2a2a] rounded-t-lg">
            <div className="flex items-center gap-2 font-bold text-ficsit-orange">
                <ShoppingCart size={20} />
                <span>Shopping List</span>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={18} />
            </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800 p-2 rounded border border-gray-600 flex flex-col items-center">
                    <span className="text-xs text-gray-400 uppercase">Total Power</span>
                    <div className="flex items-center gap-1 text-yellow-500 font-mono font-bold">
                        <Zap size={14} />
                        {bom.totalPower.toFixed(1)} MW
                    </div>
                </div>
                <div className="bg-gray-800 p-2 rounded border border-gray-600 flex flex-col items-center">
                    <span className="text-xs text-gray-400 uppercase">Buildings</span>
                    <div className="flex items-center gap-1 text-blue-400 font-mono font-bold">
                        <Package size={14} />
                        {nodes.length} Nodes
                    </div>
                </div>
            </div>

            {/* Materials */}
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b border-gray-700 pb-1">Materials Needed</h3>
                <div className="space-y-1">
                    {materialList.map(mat => (
                        <div key={mat.slug} className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">{mat.name}</span>
                            <span className="font-mono font-bold text-ficsit-orange">{mat.count.toLocaleString()}</span>
                        </div>
                    ))}
                    {materialList.length === 0 && <span className="text-xs text-gray-600">No materials required.</span>}
                </div>
            </div>

            {/* Buildings Breakdown */}
            <div>
                 <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 border-b border-gray-700 pb-1">Machine Count</h3>
                 <div className="space-y-1">
                    {machineList.map(mach => (
                        <div key={mach.name} className="flex justify-between items-center text-sm">
                             <span className="text-gray-300">{mach.name}</span>
                             <span className="font-mono text-white">x{mach.count}</span>
                        </div>
                    ))}
                 </div>
            </div>

        </div>
    </div>
  );
}

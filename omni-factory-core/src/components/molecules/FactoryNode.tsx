import React, { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings, Zap, AlertTriangle } from 'lucide-react';
import { DB } from '@/lib/db';
import { useFactoryStore } from '@/store/useFactoryStore';
import { RecipeDefinition } from '@/types/data';
import { useStore } from '@/hooks/useStore';

interface FactoryNodeProps {
  id: string; // ReactFlow passes the node ID
  data: {
    recipeId: string;
    clockSpeed: number;
  };
  selected?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FactoryNode({ id, data, selected = false }: FactoryNodeProps) {
  const [showRecipeMenu, setShowRecipeMenu] = React.useState(false);
  const updateNodeData = useFactoryStore((state) => state.updateNodeData);

  // Access store state for calculation
  const edges = useStore(useFactoryStore, (state) => state.edges);
  // We need simulation results too?
  // Actually, we can derive "Required Rate" from edges (Target Output).

  let recipe: RecipeDefinition | undefined;
  try {
    recipe = DB.getRecipe(data.recipeId);
  } catch {
    recipe = undefined;
  }

  // Calculate Machine Count and Efficiency
  const stats = useMemo(() => {
    if (!recipe || !edges) return { count: 1, utilization: 0, requiredFlow: 0 };

    // 1. Calculate Required Flow (Sum of outgoing main product)
    // Assume first product is main
    const mainProduct = recipe.products[0];
    if (!mainProduct) return { count: 1, utilization: 0, requiredFlow: 0 };

    const outgoing = edges.filter(e => e.sourceNodeId === id && e.sourceHandle === mainProduct.itemSlug);
    const requiredFlow = outgoing.reduce((acc, e) => acc + (e.flowRate || 0), 0);

    // 2. Calculate Standard Rate per Machine
    const standardRate = (mainProduct.amount * 60) / recipe.duration;
    const ratePerMachine = standardRate * (data.clockSpeed); // clockSpeed is 0.01 - 2.5

    // 3. Machine Count
    if (requiredFlow <= 0.01) return { count: 1, utilization: 0, requiredFlow: 0 };

    const count = Math.ceil(requiredFlow / ratePerMachine);

    // 4. Efficiency of Last Machine
    // Total Capacity = count * ratePerMachine
    // Used Capacity = requiredFlow
    // If count > 1, first (count-1) are 100%. Last one is remainder.
    const remainder = requiredFlow - ((count - 1) * ratePerMachine);
    // If remainder is very close to ratePerMachine (within float error), treat as 100%
    const isFull = Math.abs(remainder - ratePerMachine) < 0.001 || Math.abs(remainder) < 0.001;
    const utilization = isFull ? 100 : (remainder / ratePerMachine) * 100;

    return { count, utilization, requiredFlow };
  }, [recipe, edges, id, data.clockSpeed]);

  // If recipe not found, render fallback
  if (!recipe) {
    return (
      <div className="w-64 bg-red-900 border-2 border-red-500 rounded p-4 text-white">
        Error: Recipe {data.recipeId} not found
      </div>
    );
  }

  // Determine alternate recipes for the primary product
  const primaryProduct = recipe.products[0]?.itemSlug;
  const alternateRecipes = primaryProduct
    ? DB.getRecipesByProduct(primaryProduct).filter(r => r.id !== recipe!.id)
    : [];

  const handleRecipeChange = (newRecipeId: string) => {
    updateNodeData(id, { recipeId: newRecipeId });
    setShowRecipeMenu(false);
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setShowRecipeMenu(true);
      }}
      onMouseLeave={() => setShowRecipeMenu(false)}
      className={`
        w-72 bg-ficsit-dark text-white rounded-md shadow-lg transition-all relative
        ${selected ? 'border-2 border-ficsit-orange shadow-[0_0_10px_#FA9549]' : 'border border-ficsit-grey'}
      `}
    >
      {/* Context Menu for Recipe Selection */}
      {showRecipeMenu && alternateRecipes.length > 0 && (
        <div className="absolute top-0 left-0 w-full z-50 bg-[#1e1e1e] border border-ficsit-orange rounded shadow-xl flex flex-col p-1 max-h-48 overflow-y-auto">
           <div className="text-xs text-gray-400 px-2 py-1 border-b border-gray-700 mb-1">Switch Recipe</div>
           {alternateRecipes.map(alt => (
             <button
                type="button"
                key={alt.id}
                onClick={(e) => {
                    e.stopPropagation();
                    handleRecipeChange(alt.id);
                }}
                className="text-left text-xs px-2 py-1 hover:bg-ficsit-orange hover:text-black rounded"
             >
                {alt.name} {alt.alternate ? '(Alt)' : ''}
             </button>
           ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#2A2A2A] p-2 rounded-t-md flex items-center justify-between border-b border-ficsit-grey">
        <div className="flex items-center gap-2 font-bold text-sm">
          {/* Machine Icon Placeholder */}
          <div className="w-6 h-6 bg-ficsit-orange rounded flex items-center justify-center text-xs text-black font-mono">
             {stats.count}x
          </div>
          <div className="flex flex-col">
            <span className="truncate leading-tight">{recipe.name}</span>
            {stats.count > 50 && (
                <div className="flex items-center gap-1 text-[10px] text-red-400">
                    <AlertTriangle size={10} />
                    <span>Logistics Heavy</span>
                </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
            {data.clockSpeed > 1.0 && (
                <div className="flex gap-0.5">
                    {/* Power Shard Logic: 1 shard for <= 150%, 2 for <= 200%, 3 for > 200% */}
                    {[...Array(Math.min(3, Math.ceil((data.clockSpeed - 1) / 0.5)))].map((_, i) => (
                         // eslint-disable-next-line react/no-array-index-key
                         <Zap key={i} size={10} className="text-purple-400 fill-purple-400" />
                    ))}
                </div>
            )}
            <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
        </div>
      </div>

      {/* Body */}
      <div className="p-3 relative">
        {/* Input Handles (Left) */}
        <div className="flex flex-col gap-4 absolute -left-3 top-4">
            {recipe.ingredients.map((ing) => (
                <div key={`${ing.itemSlug}-in`} className="relative group">
                    <Handle
                        type="target"
                        position={Position.Left}
                        id={ing.itemSlug}
                        className="!w-3 !h-3 !bg-ficsit-orange !border-2 !border-white"
                        style={{ top: 'auto', left: 'auto', position: 'relative' }}
                    />
                    {/* Tooltip for Ingredient */}
                    <span className="absolute left-4 top-0 bg-black text-xs px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                        {ing.itemSlug}
                    </span>
                </div>
            ))}
        </div>

        {/* Output Handles (Right) */}
        <div className="flex flex-col gap-4 absolute -right-3 top-4">
            {recipe.products.map((prod) => (
                <div key={`${prod.itemSlug}-out`} className="relative group">
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={prod.itemSlug}
                        className="!w-3 !h-3 !bg-ficsit-orange !border-2 !border-white"
                        style={{ top: 'auto', left: 'auto', position: 'relative' }}
                    />
                    {/* Tooltip for Product */}
                    <span className="absolute right-4 top-0 bg-black text-xs px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                        {prod.itemSlug}
                    </span>
                </div>
            ))}
        </div>

        {/* Middle Content */}
        <div className="flex justify-between px-4 py-2 text-xs text-gray-300">
            <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase text-gray-500">In</span>
                {recipe.ingredients.map(ing => (
                    <div key={ing.itemSlug}>{ing.amount}/m</div>
                ))}
            </div>
             <div className="flex flex-col gap-1 text-right">
                <span className="text-[10px] uppercase text-gray-500">Out</span>
                {recipe.products.map(prod => (
                    <div key={prod.itemSlug}>{prod.amount}/m</div>
                ))}
            </div>
        </div>

        {/* Footer: Efficiency Status */}
        <div className="mt-2 pt-2 border-t border-ficsit-grey flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stats.utilization > 0 ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-400 uppercase">Efficiency</span>
            </div>

            <div className="text-right flex flex-col items-end">
                <div className="text-xs font-mono text-ficsit-orange">
                    {stats.count > 1
                        ? `${stats.count - 1} @ 100%, 1 @ ${stats.utilization.toFixed(0)}%`
                        : `${stats.utilization.toFixed(0)}%`
                    }
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default memo(FactoryNode);

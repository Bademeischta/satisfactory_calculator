import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings } from 'lucide-react';
import { DB } from '@/lib/db';
import { useFactoryStore } from '@/store/useFactoryStore';
import { RecipeDefinition } from '@/types/data';

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

  let recipe: RecipeDefinition | undefined;
  try {
    recipe = DB.getRecipe(data.recipeId);
  } catch {
    recipe = undefined;
  }

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
          <div className="w-6 h-6 bg-ficsit-orange rounded flex items-center justify-center text-xs text-black">
             M
          </div>
          <span className="truncate">{recipe.name}</span>
        </div>
        <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
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
                <div className={`w-2 h-2 rounded-full ${data.clockSpeed > 0 ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-400 uppercase">Status</span>
            </div>
            {/* We could show live efficiency here if passed via data, but for now just show clock setting */}
            <span className="text-xs font-mono text-ficsit-orange">{(data.clockSpeed * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

export default memo(FactoryNode);

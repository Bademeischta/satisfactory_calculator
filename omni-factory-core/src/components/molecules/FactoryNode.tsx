import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Settings } from 'lucide-react';
import { Recipe } from '@/types/factory';
import { RECIPE_DB } from '@/data/sample-recipes';

interface FactoryNodeProps {
  data: {
    recipeId: string;
    clockSpeed: number;
  };
  selected?: boolean;
}

function FactoryNode({ data, selected = false }: FactoryNodeProps) {
  const recipe: Recipe | undefined = RECIPE_DB[data.recipeId];

  // If recipe not found (shouldn't happen in strict mode but good for safety), render fallback
  if (!recipe) {
    return (
      <div className="w-64 bg-red-900 border-2 border-red-500 rounded p-4 text-white">
        Error: Recipe {data.recipeId} not found
      </div>
    );
  }

  return (
    <div
      className={`
        w-72 bg-ficsit-dark text-white rounded-md shadow-lg transition-all
        ${selected ? 'border-2 border-ficsit-orange shadow-[0_0_10px_#FA9549]' : 'border border-ficsit-grey'}
      `}
    >
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

        {/* Footer: Clock Speed */}
        <div className="mt-2 pt-2 border-t border-ficsit-grey">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-ficsit-orange">Clock Speed</span>
                <span>{(data.clockSpeed * 100).toFixed(0)}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="2.5"
                step="0.01"
                defaultValue={data.clockSpeed}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-ficsit-orange"
            />
        </div>
      </div>
    </div>
  );
}

// Add defaultProps to satisfy react/require-default-props
FactoryNode.defaultProps = {
  selected: false,
};

export default memo(FactoryNode);

import React from 'react';
import { RECIPE_DB } from '@/data/sample-recipes';
import { LayoutGrid } from 'lucide-react';

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, recipeId: string) => {
    event.dataTransfer.setData('application/reactflow', recipeId);
    // eslint-disable-next-line no-param-reassign
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-[#141414] border-r border-ficsit-grey flex flex-col h-full">
      <div className="p-4 border-b border-ficsit-grey flex items-center gap-2">
        <LayoutGrid className="text-ficsit-orange w-5 h-5" />
        <h2 className="font-bold text-white uppercase tracking-wider text-sm">Build Menu</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {Object.values(RECIPE_DB).map((recipe) => (
          <div
            key={recipe.id}
            onDragStart={(event) => onDragStart(event, recipe.id)}
            draggable
            className="
              bg-ficsit-dark border border-ficsit-grey p-3 rounded
              cursor-grab active:cursor-grabbing hover:border-ficsit-orange hover:bg-[#2A2A2A]
              transition-all group flex items-center gap-3
            "
          >
            {/* Icon Placeholder */}
            <div className="w-8 h-8 bg-ficsit-orange rounded flex items-center justify-center text-black font-bold text-xs">
              {recipe.name.substring(0, 2)}
            </div>

            <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-200 group-hover:text-white">
                    {recipe.name}
                </span>
                <span className="text-[10px] text-gray-500">
                    {recipe.producedIn[0]?.replace('build_', '')}
                </span>
            </div>
          </div>
        ))}

        <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700 text-xs text-gray-500 text-center">
            Drag items to canvas to build.
        </div>
      </div>
    </aside>
  );
};

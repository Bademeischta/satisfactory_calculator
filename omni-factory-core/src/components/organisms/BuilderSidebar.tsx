import React, { useState } from 'react';
import { LayoutGrid, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { DB } from '@/lib/db';
import { RecipeDefinition } from '@/types/data';

// Helper to group recipes by building
function getRecipesByBuilding() {
  const recipes = DB.getAllRecipes();
  const groups: Record<string, RecipeDefinition[]> = {};

  recipes.forEach(recipe => {
    // Some recipes might not have producedIn or it might be empty
    const buildingSlug = recipe.producedIn[0] || 'manual';
    if (!groups[buildingSlug]) {
      groups[buildingSlug] = [];
    }
    groups[buildingSlug].push(recipe);
  });

  return groups;
}

const RAW_RESOURCES = [
  { slug: 'desc_iron_ore', name: 'Iron Ore' },
  { slug: 'desc_copper_ore', name: 'Copper Ore' },
  { slug: 'desc_coal', name: 'Coal' },
  { slug: 'desc_stone', name: 'Stone' },
  { slug: 'desc_limestone', name: 'Limestone' },
  { slug: 'desc_water', name: 'Water' },
  { slug: 'desc_liquid_oil', name: 'Crude Oil' },
];

export function BuilderSidebar() {
  const [groups] = useState(getRecipesByBuilding());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'raw_resources': true,
    'build_smelter': true,
    'build_constructor': true,
  });

  const toggleGroup = (slug: string) => {
    setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  const onDragStart = (event: React.DragEvent, recipeId: string) => {
    event.dataTransfer.setData('application/reactflow', recipeId);
    // eslint-disable-next-line no-param-reassign
    event.dataTransfer.effectAllowed = 'move';
  };

  // Helper to get nice name for building slug
  const getBuildingName = (slug: string) => {
      try {
          if (slug === 'manual') return 'Manual Crafting';
          return DB.getBuilding(slug).name;
      } catch {
          return slug.replace('build_', '');
      }
  };

  return (
    <aside className="w-64 bg-[#141414] border-r border-ficsit-grey flex flex-col h-full">
      <div className="p-4 border-b border-ficsit-grey flex flex-col gap-2">
         <div className="flex items-center gap-2">
            <LayoutGrid className="text-ficsit-orange w-5 h-5" />
            <h2 className="font-bold text-white uppercase tracking-wider text-sm">Builder</h2>
         </div>
         {/* Search stub */}
         <div className="relative">
             <Search className="absolute left-2 top-2 w-3 h-3 text-gray-500" />
             <input
                type="text"
                placeholder="Search parts..."
                className="w-full bg-black border border-gray-700 rounded pl-7 py-1 text-xs text-white focus:border-ficsit-orange outline-none"
             />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {/* Raw Resources Category */}
        <div className="border border-gray-800 rounded bg-[#1A1A1A] overflow-hidden">
            <button
                type="button"
                onClick={() => toggleGroup('raw_resources')}
                className="w-full flex items-center justify-between p-2 text-xs font-bold text-ficsit-orange hover:bg-[#252525] transition-colors"
            >
                <span>Raw Resources</span>
                {expanded.raw_resources ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>

            {expanded.raw_resources && (
                <div className="p-2 grid grid-cols-4 gap-2 bg-[#111]">
                    {RAW_RESOURCES.map(res => (
                         <div
                            key={res.slug}
                            draggable
                            onDragStart={(e) => onDragStart(e, res.slug)}
                            className="aspect-square bg-gray-800 rounded border border-gray-700 hover:border-ficsit-orange cursor-grab active:cursor-grabbing flex items-center justify-center relative group"
                         >
                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">
                                {res.name.substring(0, 2)}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute left-full top-0 ml-2 z-50 w-32 bg-black border border-ficsit-orange p-2 rounded shadow-xl hidden group-hover:block pointer-events-none">
                                <div className="text-ficsit-orange font-bold text-xs">{res.name}</div>
                                <div className="text-[10px] text-gray-400">Drag to add Miner</div>
                            </div>
                         </div>
                    ))}
                </div>
            )}
        </div>

        {Object.entries(groups).map(([buildingSlug, recipes]) => (
            <div key={buildingSlug} className="border border-gray-800 rounded bg-[#1A1A1A] overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleGroup(buildingSlug)}
                    className="w-full flex items-center justify-between p-2 text-xs font-bold text-gray-300 hover:bg-[#252525] transition-colors"
                >
                    <span className="capitalize">{getBuildingName(buildingSlug)}</span>
                    {expanded[buildingSlug] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>

                {expanded[buildingSlug] && (
                    <div className="p-2 grid grid-cols-4 gap-2 bg-[#111]">
                        {recipes.map(recipe => (
                             <div
                                key={recipe.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, recipe.id)}
                                className="aspect-square bg-gray-800 rounded border border-gray-700 hover:border-ficsit-orange cursor-grab active:cursor-grabbing flex items-center justify-center relative group"
                             >
                                {/* Simple Icon Text Fallback */}
                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">
                                    {recipe.name.substring(0,2)}
                                </span>

                                {/* Tooltip */}
                                <div className="absolute left-full top-0 ml-2 z-50 w-48 bg-black border border-ficsit-orange p-2 rounded shadow-xl hidden group-hover:block pointer-events-none">
                                    <div className="text-ficsit-orange font-bold text-xs border-b border-gray-800 pb-1 mb-1">{recipe.name}</div>
                                    <div className="text-[10px] text-gray-400">
                                        {recipe.ingredients.map(i => (
                                            <div key={i.itemSlug}>{i.amount}/m {i.itemSlug.replace('desc_', '')}</div>
                                        ))}
                                        <div className="text-center my-1">⬇</div>
                                        {recipe.products.map(p => (
                                            <div key={p.itemSlug} className="text-white">{p.amount}/m {p.itemSlug.replace('desc_', '')}</div>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                )}
            </div>
        ))}
      </div>
    </aside>
  );
}

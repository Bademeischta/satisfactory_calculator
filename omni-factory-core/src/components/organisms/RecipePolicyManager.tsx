import React, { useState, useMemo } from 'react';
import { X, BookOpen } from 'lucide-react';
import { useFactoryStore } from '@/store/useFactoryStore';
import { DB } from '@/lib/db';

interface RecipePolicyManagerProps {
  onClose: () => void;
}

export function RecipePolicyManager({ onClose }: RecipePolicyManagerProps) {
  const nodes = useFactoryStore((state) => state.nodes);
  const updateNodeData = useFactoryStore((state) => state.updateNodeData);
  const globalBeltTier = useFactoryStore((state) => state.globalBeltTier);
  const setGlobalBeltTier = useFactoryStore((state) => state.setGlobalBeltTier);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Identify all products being produced
  const producedItems = useMemo(() => {
    const productsMap = new Map<string, { itemSlug: string; recipesUsed: Set<string>; count: number }>();

    nodes.forEach(node => {
      try {
        const recipe = DB.getRecipe(node.recipeId);
        // We assume the first product is the "Main" product for categorization
        if (recipe.products.length > 0) {
           const mainProduct = recipe.products[0].itemSlug;
           if (!productsMap.has(mainProduct)) {
             productsMap.set(mainProduct, { itemSlug: mainProduct, recipesUsed: new Set(), count: 0 });
           }
           const entry = productsMap.get(mainProduct)!;
           entry.recipesUsed.add(recipe.id);
           entry.count += 1;
        }
      } catch {
        // Ignore invalid recipes
      }
    });

    return Array.from(productsMap.values());
  }, [nodes]);

  // Filter list
  const filteredProducts = useMemo(() => producedItems.filter(p => {
      try {
          const item = DB.getItem(p.itemSlug);
          return item.name.toLowerCase().includes(searchTerm.toLowerCase());
      } catch { return false; }
  }), [producedItems, searchTerm]);

  const handleRecipeChange = (itemSlug: string, newRecipeId: string) => {
    // Update ALL nodes producing this item (as main product)
    nodes.forEach(node => {
        try {
            const currentRecipe = DB.getRecipe(node.recipeId);
            if (currentRecipe.products[0]?.itemSlug === itemSlug) {
                if (currentRecipe.id !== newRecipeId) {
                    updateNodeData(node.id, { recipeId: newRecipeId });
                }
            }
        } catch {
            // Ignore
        }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1e1e1e] border border-ficsit-orange rounded-lg shadow-2xl w-[800px] max-h-[80vh] flex flex-col text-white relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="text-ficsit-orange" />
            Global Recipe Policies
            </h2>
            <p className="text-sm text-gray-400 mt-1">
                Standardize production methods across your factory.
            </p>
            <div className="mt-4">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="hidden" htmlFor="policy-search">Search</label>
                <input
                    id="policy-search"
                    type="text"
                    placeholder="Search items..."
                    className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-ficsit-orange outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Logistics Settings */}
            <div className="bg-[#2a2a2a] p-4 rounded border border-gray-700">
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Logistics Standards</h3>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Max Belt Tier (Global Limit)</span>
                    <select
                        className="bg-black border border-gray-600 rounded px-3 py-1 text-xs text-white focus:border-ficsit-orange outline-none"
                        value={globalBeltTier || 5}
                        onChange={(e) => setGlobalBeltTier(Number(e.target.value))}
                    >
                        <option value={1}>Mk.1 (60/m)</option>
                        <option value={2}>Mk.2 (120/m)</option>
                        <option value={3}>Mk.3 (270/m)</option>
                        <option value={4}>Mk.4 (480/m)</option>
                        <option value={5}>Mk.5 (780/m)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Recipe Policies</h3>
            {filteredProducts.map(prod => {
                let itemName = prod.itemSlug;
                // eslint-disable-next-line no-empty
                try { itemName = DB.getItem(prod.itemSlug).name; } catch {}

                // Get available recipes
                const availableRecipes = DB.getRecipesByProduct(prod.itemSlug);

                // Determine current status
                const isMixed = prod.recipesUsed.size > 1;
                const currentRecipeId = prod.recipesUsed.size === 1 ? Array.from(prod.recipesUsed)[0] : '';

                return (
                    <div key={prod.itemSlug} className="flex items-center justify-between bg-[#2a2a2a] p-3 rounded border border-gray-700 hover:border-gray-500">
                        <div className="flex items-center gap-4">
                             <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-[10px] font-bold">
                                {itemName.substring(0, 2)}
                             </div>
                             <div>
                                 <div className="font-bold text-sm">{itemName}</div>
                                 <div className="text-xs text-gray-400">
                                     Produces in {prod.count} machine{prod.count !== 1 ? 's' : ''}
                                 </div>
                             </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isMixed && (
                                <span className="text-xs text-yellow-500 font-bold px-2 py-1 bg-yellow-500/10 rounded">
                                    MIXED
                                </span>
                            )}

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Use Policy:</span>
                                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                                <select
                                    className="bg-black border border-gray-600 rounded px-2 py-1 text-xs text-white focus:border-ficsit-orange outline-none w-48"
                                    value={currentRecipeId}
                                    onChange={(e) => handleRecipeChange(prod.itemSlug, e.target.value)}
                                >
                                    {isMixed && <option value="">(Multiple Selected)</option>}
                                    {availableRecipes.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} {r.alternate ? '(Alt)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );
            })}

            {filteredProducts.length === 0 && (
                <div className="text-center text-gray-500 mt-10">No items found.</div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}

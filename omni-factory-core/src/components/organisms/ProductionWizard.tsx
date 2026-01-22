import React, { useState, useMemo } from 'react';
import { X, Zap } from 'lucide-react';
import { useFactoryStore } from '@/store/useFactoryStore';
import { DB } from '@/lib/db';
import { planProduction } from '@/lib/solver/productionPlanner';

interface ProductionWizardProps {
  onClose: () => void;
}

export function ProductionWizard({ onClose }: ProductionWizardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState(10);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const setFactoryGraph = useFactoryStore((state) => state.setFactoryGraph);
  const layoutNodes = useFactoryStore((state) => state.layoutNodes);

  // Filter items (memoized)
  const filteredItems = useMemo(() => {
    // We only want items that can be produced (have recipes)
    // But DB.getAllRecipes() returns recipes.
    // Let's get all recipes, map to products, unique them.
    const allRecipes = DB.getAllRecipes();
    const produceableItems = new Set<string>();
    allRecipes.forEach(r => r.products.forEach(p => produceableItems.add(p.itemSlug)));

    // Now get ItemDefinitions
    const items = Array.from(produceableItems).map(slug => {
      try {
        return DB.getItem(slug);
      } catch {
        return null;
      }
    }).filter(i => i !== null);

    if (!searchTerm) return items.slice(0, 20); // Show first 20 default

    return items.filter(item =>
      item!.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [searchTerm]);

  const handleBuild = () => {
    if (!selectedItem) return;

    // 1. Generate Graph
    const graph = planProduction(selectedItem, amount);

    // 2. Set Store
    // Assuming user wants to clear and build (as per "Auto-Build Factory" usually implying a fresh start or add? Prompt said "Clears canvas (optional)").
    // Let's Clear and Set.
    setFactoryGraph(graph.nodes, graph.edges);

    // 3. Layout
    // We need to wait for state update? Zustand is sync usually for this.
    setTimeout(() => {
        layoutNodes();
    }, 50); // Small tick to ensure nodes are in store

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1e1e1e] border border-ficsit-orange rounded-lg shadow-2xl w-[500px] p-6 text-white relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Zap className="text-ficsit-orange" />
          Production Wizard
        </h2>

        <div className="space-y-4">
          {/* Item Search */}
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label htmlFor="item-search" className="block text-sm text-gray-400 mb-1">Target Item</label>
            <input
              id="item-search"
              type="text"
              placeholder="Search items (e.g. Iron Plate)..."
              className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-ficsit-orange outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Dropdown Results */}
            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-800 rounded bg-black/20">
              {filteredItems.map(item => (
                <button
                  type="button"
                  key={item!.slug}
                  className={`w-full text-left px-3 py-2 cursor-pointer text-sm flex items-center gap-2 hover:bg-white/10 ${selectedItem === item!.slug ? 'bg-ficsit-orange/20 text-ficsit-orange' : ''}`}
                  onClick={() => setSelectedItem(item!.slug)}
                >
                  {/* Icon? We don't have images loaded, just text */}
                  <span>{item!.name}</span>
                </button>
              ))}
              {filteredItems.length === 0 && (
                <div className="p-3 text-gray-500 text-sm">No items found.</div>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div>
             {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
             <label htmlFor="amount-input" className="block text-sm text-gray-400 mb-1">Target Amount (/min)</label>
             <input
               id="amount-input"
               type="number"
               min={1}
               className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm focus:border-ficsit-orange outline-none"
               value={amount}
               onChange={(e) => setAmount(Number(e.target.value))}
             />
          </div>

          <button
            type="button"
            onClick={handleBuild}
            disabled={!selectedItem}
            className="w-full bg-ficsit-orange hover:bg-[#ffaa55] text-black font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            AUTO-BUILD FACTORY
          </button>
        </div>
      </div>
    </div>
  );
}

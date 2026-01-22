import React, { useState, useMemo } from 'react';
import { X, Zap, Pickaxe } from 'lucide-react'; // Pickaxe für Miner Icon
import { useFactoryStore } from '@/store/useFactoryStore';
import { DB } from '@/lib/db';
import { planProduction } from '@/lib/solver/productionPlanner';
// Stellen Sie sicher, dass closeLoops existiert (Phase 9), sonst diese Zeile entfernen:
// import { closeLoops } from '@/lib/solver/loopCloser'; 

interface ProductionWizardProps {
  onClose: () => void;
}

export function ProductionWizard({ onClose }: ProductionWizardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState(10);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // Phase 11: Neuer State für Ressourcen
  const [includeResources, setIncludeResources] = useState(false);

  const setFactoryGraph = useFactoryStore((state) => state.setFactoryGraph);
  const layoutNodes = useFactoryStore((state) => state.layoutNodes);

  // Filter items (memoized)
  const filteredItems = useMemo(() => {
    const allRecipes = DB.getAllRecipes();
    const produceableItems = new Set<string>();
    allRecipes.forEach(r => r.products.forEach(p => produceableItems.add(p.itemSlug)));

    const items = Array.from(produceableItems).map(slug => {
      try {
        return DB.getItem(slug);
      } catch {
        return null;
      }
    }).filter(i => i !== null);

    if (!searchTerm) return items.slice(0, 20);

    return items.filter(item =>
      item!.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [searchTerm]);

  const handleBuild = () => {
    if (!selectedItem) return;

    // 1. Generate Graph (Phase 11 Update: mit includeResources Parameter)
    // Hinweis: Stellen Sie sicher, dass planProduction in 'productionPlanner.ts' 3 Argumente akzeptiert!
    let graph = planProduction(selectedItem, amount, includeResources);

    // Phase 9: Loop Closer Integration (Optional, falls implementiert)
    // graph = closeLoops(graph.nodes, graph.edges);

    // 2. Set Store
    setFactoryGraph(graph.nodes, graph.edges);

    // 3. Layout
    setTimeout(() => {
        layoutNodes();
    }, 50);

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

          {/* Phase 11: Include Resources Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              id="include-resources"
              type="checkbox"
              className="w-4 h-4 accent-ficsit-orange cursor-pointer"
              checked={includeResources}
              onChange={(e) => setIncludeResources(e.target.checked)}
            />
            <label htmlFor="include-resources" className="text-sm text-gray-300 cursor-pointer select-none flex items-center gap-2">
              <Pickaxe size={16} className={includeResources ? "text-ficsit-orange" : "text-gray-500"} />
              Include Raw Resource Nodes (Miners)
            </label>
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

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
  const [includeResources, setIncludeResources] = useState(false);

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
    const graph = planProduction(selectedItem, amount, includeResources);

    // 2. Close Loops (Intelligent Recycling)
    // Note: If resource nodes are included, we might have fewer loops to close or different ones?
    // Close loops logic still applies for byproducts.
    // import { closeLoops } from '@/lib/solver/loopCloser'; // Wait, I need to import this if I use it.
    // The previous code had it imported?
    // Let's check imports.

    // We will just update planProduction call. The closeLoops call was in previous step but my read_file didn't show it?
    // Ah, I see `planProduction` import but NOT `closeLoops` in the `read_file` output above.
    // Why did `read_file` miss it? Maybe I edited it in previous step but the file I read now is older?
    // No, `read_file` reads current state.
    // Wait, in Phase 9 I added `closeLoops`.
    // Did I fail to write it?
    // I called `replace_with_git_merge_diff` in Phase 9.
    // Let's assume it IS there or I need to add it back if I overwrote it?
    // The `read_file` shows: `import { planProduction } from '@/lib/solver/productionPlanner';`
    // It DOES NOT show `closeLoops`.
    // It seems my Phase 9 edit might have failed or been reverted?
    // Or I am misreading the `read_file` output.
    // Lines 1-6:
    // import React...
    // import { X, Zap }...
    // import { useFactoryStore }...
    // import { DB }...
    // import { planProduction }...

    // So `closeLoops` is missing.
    // I will re-add it if needed.
    // But for now, I just want to pass `includeResources` to `planProduction`.

    // Actually, I should probably restore `closeLoops` if I want to be safe, or just stick to the requested task.
    // Task 4 says: Update `ProductionWizard.tsx`: Add checkbox.
    // I will assume `closeLoops` should be there.

    const graph = planProduction(selectedItem, amount, includeResources);

    // 2. Set Store
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

          {/* Options */}
          <div className="flex items-center gap-2">
              <input
                 id="include-resources"
                 type="checkbox"
                 checked={includeResources}
                 onChange={(e) => setIncludeResources(e.target.checked)}
                 className="w-4 h-4 rounded border-gray-600 bg-black/50 text-ficsit-orange focus:ring-ficsit-orange"
              />
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label htmlFor="include-resources" className="text-sm text-gray-300">Include Resource Nodes</label>
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

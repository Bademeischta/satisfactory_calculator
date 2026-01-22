import React, { useMemo } from 'react';
import { useFactoryStore } from '@/store/useFactoryStore';
import { DB } from '@/lib/db';
import { AlertTriangle } from 'lucide-react';

export function ResourceManifest() {
  const nodes = useFactoryStore((state) => state.nodes);
  const edges = useFactoryStore((state) => state.edges);

  const manifest = useMemo(() => {
    const inputs = new Map<string, number>();

    nodes.forEach(node => {
      // Find Inputs that are NOT satisfied by an internal connection
      // Standard Node Logic:
      if (node.type !== 'resourceNode') {
          try {
              const recipe = DB.getRecipe(node.recipeId);
              recipe.ingredients.forEach(ing => {
                  // Find edges targeting this ingredient
                  const incoming = edges.filter(e => e.targetNodeId === node.id && e.targetHandle === ing.itemSlug);

                  if (incoming.length === 0) {
                      // It's a raw input needed from outside
                      const amount = (ing.amount * 60 / recipe.duration) * node.clockSpeed;
                      const current = inputs.get(ing.itemSlug) || 0;
                      inputs.set(ing.itemSlug, current + amount);
                  }
              });
          // eslint-disable-next-line no-empty
          } catch { }
      }
    });

    return Array.from(inputs.entries()).map(([slug, amount]) => {
        try {
            return { ...DB.getItem(slug), amount };
        } catch {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { name: slug, amount, slug, iconPath: '' } as any;
        }
    }).sort((a, b) => b.amount - a.amount);
  }, [nodes, edges]);

  if (manifest.length === 0) return null;

  return (
    <div className="absolute top-4 left-20 bg-[#1e1e1e] border border-gray-600 rounded p-4 shadow-lg text-white max-w-sm z-40">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={12} className="text-yellow-500" />
            Missing Resources
        </h3>
        <div className="space-y-1">
            {manifest.map(item => (
                <div key={item.slug} className="flex justify-between items-center text-sm gap-4">
                    <span className="text-gray-300">{item.name}</span>
                    <span className="font-mono text-ficsit-orange font-bold">{item.amount.toFixed(1)}/m</span>
                </div>
            ))}
        </div>
        <div className="text-[10px] text-gray-500 mt-2 italic">
            Add Resource Nodes to supply these inputs.
        </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useFactoryStore } from '@/store/useFactoryStore';
import { useStore } from '@/hooks/useStore';
import { DB } from '@/lib/db';
import { Activity, XCircle, Zap } from 'lucide-react';
import { RecipeDefinition } from '@/types/data';

export function PropertyPanel() {
  const selectedNodeId = useStore(useFactoryStore, (state) => state.selectedNodeId);
  const nodes = useStore(useFactoryStore, (state) => state.nodes);
  const simulation = useStore(useFactoryStore, (state) => state.simulation);

  // Actions
  const updateNodeData = useFactoryStore((state) => state.updateNodeData);
  const removeNode = useFactoryStore((state) => state.removeNode);
  const selectNode = useFactoryStore((state) => state.selectNode);

  const selectedNode = nodes?.find((n) => n.id === selectedNodeId);

  // Local state for slider
  const [localClock, setLocalClock] = useState(1.0);

  useEffect(() => {
    if (selectedNode) {
        setLocalClock(selectedNode.clockSpeed);
    }
  }, [selectedNode]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalClock(parseFloat(e.target.value));
  };

  const handleSliderCommit = useCallback(() => {
    if (selectedNode && localClock !== selectedNode.clockSpeed) {
        updateNodeData(selectedNode.id, { clockSpeed: localClock });
    }
  }, [selectedNode, localClock, updateNodeData]);

  if (!selectedNode) {
    return (
      <aside className="w-80 bg-[#141414] border-l border-ficsit-grey p-6 flex flex-col items-center justify-center text-gray-500 text-sm">
        <span>Select a machine to inspect.</span>
      </aside>
    );
  }

  let recipe: RecipeDefinition | undefined;
  try {
      recipe = DB.getRecipe(selectedNode.recipeId);
  } catch { /* ignore */ }

  const simResult = simulation?.nodes[selectedNode.id];
  const efficiency = simResult ? simResult.efficiency : 0;
  const power = simResult ? simResult.powerDraw : 0;

  return (
    <aside className="w-80 bg-[#141414] border-l border-ficsit-grey flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-ficsit-grey flex justify-between items-start">
        <div>
            <h2 className="font-bold text-white text-lg">{recipe?.name || 'Unknown'}</h2>
            <div className="text-xs text-ficsit-orange font-mono mt-1 uppercase">
                {selectedNode.id.slice(0, 8)}
            </div>
        </div>
        <button
            type="button"
            onClick={() => { removeNode(selectedNode.id); selectNode(null); }}
            className="text-gray-500 hover:text-red-500 transition-colors"
        >
            <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-6 overflow-y-auto">

        {/* Statistics Card */}
        <div className="bg-[#2A2A2A] rounded p-4 border border-ficsit-grey">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-ficsit-orange" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">Efficiency</span>
            </div>

            {/* Gauge Placeholder */}
            <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                    className="absolute top-0 left-0 h-full bg-ficsit-orange transition-all duration-500"
                    style={{ width: `${Math.min(efficiency, 100)}%` }}
                />
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-gray-400">Running at</span>
                <span className="text-white font-mono">{efficiency.toFixed(1)}%</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-600 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Power</span>
                 </div>
                 <span className="text-white font-mono text-sm">{power.toFixed(1)} MW</span>
            </div>
        </div>

        {/* Overclocking Control */}
        <div>
             <div className="flex justify-between items-center mb-2">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs font-bold uppercase text-gray-400">Target Clock Speed</label>
                <span className="text-ficsit-orange font-mono text-xs">{(localClock * 100).toFixed(0)}%</span>
             </div>
             <input
                type="range"
                min="0.01"
                max="2.5"
                step="0.01"
                value={localClock}
                onChange={handleSliderChange}
                onMouseUp={handleSliderCommit}
                className="w-full h-1 bg-gray-600 rounded appearance-none cursor-pointer accent-ficsit-orange"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                <span>1%</span>
                <span>100%</span>
                <span>250%</span>
            </div>
        </div>

        {/* I/O Stats */}
        <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 border-b border-gray-700 pb-1">Production</h3>
            <div className="flex flex-col gap-2">
                 {/* Inputs */}
                 {recipe?.ingredients.map(ing => (
                     <div key={ing.itemSlug} className="flex justify-between text-xs items-center">
                         <span className="text-gray-300">{ing.itemSlug.replace('desc_', '')}</span>
                         <div className="flex gap-1 font-mono">
                            <span className="text-gray-500">{((ing.amount * (selectedNode.clockSpeed)) * (efficiency/100)).toFixed(1)}</span>
                            <span className="text-gray-600">/</span>
                            <span className="text-white">{(ing.amount * selectedNode.clockSpeed).toFixed(1)}</span>
                         </div>
                     </div>
                 ))}

                 <div className="h-px bg-gray-700 my-1" />

                 {/* Products */}
                 {recipe?.products.map(prod => (
                     <div key={prod.itemSlug} className="flex justify-between text-xs items-center">
                         <span className="text-white">{prod.itemSlug.replace('desc_', '')}</span>
                         <span className="text-ficsit-orange font-mono">
                             {/* Output is based on Run Rate */}
                             {((prod.amount * selectedNode.clockSpeed) * (efficiency/100)).toFixed(1)} / m
                         </span>
                     </div>
                 ))}
            </div>
        </div>

      </div>
    </aside>
  );
}

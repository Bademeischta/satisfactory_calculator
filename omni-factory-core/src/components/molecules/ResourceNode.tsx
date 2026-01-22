import React, { memo, useState, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { Droplets, Pickaxe } from 'lucide-react';
import { useFactoryStore } from '@/store/useFactoryStore';

interface ResourceNodeProps {
  id: string;
  data: {
    recipeId: string; // Used as "Item Slug" for resources (e.g. 'desc_iron_ore')
    clockSpeed: number;
    machineTier?: number; // 1, 2, 3
    purity?: number; // 0.5, 1.0, 2.0
  };
  selected?: boolean;
}

const RESOURCES = [
  { slug: 'desc_iron_ore', name: 'Iron Ore' },
  { slug: 'desc_copper_ore', name: 'Copper Ore' },
  { slug: 'desc_coal', name: 'Coal' },
  { slug: 'desc_stone', name: 'Stone' },
  { slug: 'desc_limestone', name: 'Limestone' },
  { slug: 'desc_caterium_ore', name: 'Caterium Ore' },
  { slug: 'desc_raw_quartz', name: 'Raw Quartz' },
  { slug: 'desc_sulfur', name: 'Sulfur' },
  { slug: 'desc_bauxite', name: 'Bauxite' },
  { slug: 'desc_uranium', name: 'Uranium' },
  { slug: 'desc_water', name: 'Water' },
  { slug: 'desc_liquid_oil', name: 'Crude Oil' },
  { slug: 'desc_nitrogen_gas', name: 'Nitrogen Gas' },
];

const PURITY_OPTIONS = [
  { value: 0.5, label: 'Impure' },
  { value: 1.0, label: 'Normal' },
  { value: 2.0, label: 'Pure' },
];

function ResourceNode({ id, data, selected = false }: ResourceNodeProps) {
  const updateNodeData = useFactoryStore((state) => state.updateNodeData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isHovered, setIsHovered] = useState(false);

  // Defaults
  const purity = data.purity || 1.0;
  const tier = data.machineTier || 1;
  const itemSlug = data.recipeId || 'desc_iron_ore';

  // Calculate Output
  const outputRate = useMemo(() => {
    // Base Rates:
    // Solid: Mk.1=60, Mk.2=120, Mk.3=240
    // Liquid (Water): 120 (Standard Extractor)
    // Oil: 120 (Pump) * Purity? No, Oil is node specific.
    // Let's standardize:
    // If Solid (Ore): Base 60 * TierMultiplier * Purity * Clock
    // TierMultiplier: Mk1=1, Mk2=2, Mk3=4
    // If Liquid (Water): Base 120 * Clock (Purity N/A usually, but let's allow 1.0)
    // If Oil: Base 60 * Tier * Purity * Clock? (Oil pump is pure variable).

    // Simplified Logic:
    let base = 60;
    let tierMult = 1;

    if (itemSlug === 'desc_water') {
        base = 120; // Water Extractor
        // Water doesn't have tiers usually, nor purity (infinite ocean).
        // Treat as Purity 1, Tier 1.
    } else if (itemSlug === 'desc_liquid_oil' || itemSlug === 'desc_nitrogen_gas') {
        base = 60; // Resource Well / Oil Node base
        // Oil Pump matches Miner logic mostly?
    } else {
        // Solid Miner
        base = 60;
        if (tier === 2) tierMult = 2;
        if (tier === 3) tierMult = 4;
    }

    // For Fluids/Gas (except water), Purity matters.
    // For Water, Purity is usually ignored (1.0).
    const effectivePurity = itemSlug === 'desc_water' ? 1.0 : purity;

    // Cap clock speed at 2.5 visual logic if needed, but resource node IS the machine.
    // So output is capacity.
    // If user sets clock > 2.5, we should probably cap it or allow it as "Cheating"?
    // The directive says "Hard Cap clockSpeed visual calculation at 250%".
    const effectiveClock = Math.min(data.clockSpeed, 2.5);

    return base * tierMult * effectivePurity * effectiveClock;
  }, [itemSlug, tier, purity, data.clockSpeed]);


  const handleResourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { recipeId: e.target.value });
  };

  const handlePurityChange = (val: number) => {
    updateNodeData(id, { purity: val });
  };

  const handleTierChange = (val: number) => {
      updateNodeData(id, { machineTier: val });
  };

  // const resourceName = RESOURCES.find(r => r.slug === itemSlug)?.name || 'Unknown';
  const isLiquid = itemSlug === 'desc_water' || itemSlug === 'desc_liquid_oil' || itemSlug === 'desc_nitrogen_gas';

  return (
    <div
      className={`
        w-64 bg-[#1a1a1a] text-white rounded-xl shadow-xl transition-all relative border-2
        ${selected ? 'border-ficsit-orange shadow-[0_0_15px_#FA9549]' : 'border-gray-700'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hex Header */}
      <div className="bg-gray-800 p-3 rounded-t-xl flex items-center gap-3 border-b border-gray-700">
         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLiquid ? 'bg-blue-600' : 'bg-gray-500'}`}>
             {isLiquid ? <Droplets size={20} /> : <Pickaxe size={20} />}
         </div>
         <div className="flex-1">
             <div className="text-[10px] uppercase text-gray-400 font-bold">Extraction</div>
             <select
                className="bg-transparent font-bold text-sm w-full outline-none cursor-pointer hover:text-ficsit-orange"
                value={itemSlug}
                onChange={handleResourceChange}
             >
                 {RESOURCES.map(r => <option key={r.slug} value={r.slug}>{r.name}</option>)}
             </select>
         </div>
      </div>

      {/* Body Controls */}
      <div className="p-3 space-y-3">

          {/* Output Rate Big Display */}
          <div className="text-center bg-black/30 rounded p-2 border border-gray-700">
              <div className="text-3xl font-mono text-ficsit-orange font-bold leading-none">
                  {outputRate.toFixed(0)}
              </div>
              <div className="text-[10px] text-gray-500 uppercase mt-1">Units / Min</div>
          </div>

          {/* Controls */}
          <div className="space-y-2">
               {/* Tier Selector */}
               {!isLiquid && itemSlug !== 'desc_water' && (
                   <div className="flex bg-gray-900 rounded p-1">
                       {[1, 2, 3].map(t => (
                           <button
                             key={t}
                             type="button"
                             onClick={() => handleTierChange(t)}
                             className={`flex-1 text-[10px] font-bold py-1 rounded ${tier === t ? 'bg-ficsit-orange text-black' : 'text-gray-500 hover:bg-white/10'}`}
                           >
                               MK.{t}
                           </button>
                       ))}
                   </div>
               )}

               {/* Purity Selector */}
               {itemSlug !== 'desc_water' && (
                   <div className="flex bg-gray-900 rounded p-1">
                       {PURITY_OPTIONS.map(opt => (
                           <button
                             key={opt.value}
                             type="button"
                             onClick={() => handlePurityChange(opt.value)}
                             className={`flex-1 text-[10px] font-bold py-1 rounded ${purity === opt.value ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-white/10'}`}
                           >
                               {opt.label[0]}
                           </button>
                       ))}
                   </div>
               )}
          </div>

      </div>

      {/* Output Handle */}
      <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
        <Handle
            type="source"
            position={Position.Right}
            id={itemSlug}
            className="!w-4 !h-4 !bg-ficsit-orange !border-2 !border-white"
        />
      </div>
    </div>
  );
}

export default memo(ResourceNode);

import React, { useState } from 'react';
import { useFactoryStore } from '@/store/useFactoryStore';
import { Trash2, Network, Wand2, Share2 } from 'lucide-react';
import { ProductionWizard } from '@/components/organisms/ProductionWizard';
import { compressState } from '@/lib/compression';

export function Toolbar() {
  const clearFactory = useFactoryStore((state) => state.clearFactory);
  const layoutNodes = useFactoryStore((state) => state.layoutNodes);
  const { nodes, edges } = useFactoryStore((state) => ({ nodes: state.nodes, edges: state.edges }));

  const [showWizard, setShowWizard] = useState(false);

  const handleClear = () => {
    // eslint-disable-next-line no-alert
    if (
      window.confirm(
        'Are you sure you want to dismantle the entire factory? This cannot be undone.',
      )
    ) {
      clearFactory();
    }
  };

  const handleShare = () => {
    const hash = compressState(nodes, edges);
    const url = `${window.location.origin}${window.location.pathname}?state=${hash}`;
    navigator.clipboard.writeText(url);
    // eslint-disable-next-line no-alert
    alert('Factory URL copied to clipboard!');
  };

  return (
    <>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#141414]/90 backdrop-blur-sm border border-ficsit-grey rounded-full px-6 py-2 shadow-xl z-50 flex gap-4">
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-2 text-white hover:text-red-500 transition-colors text-sm font-bold group"
        >
          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Clear</span>
        </button>

        <div className="w-px bg-gray-700 h-6 my-auto" />

        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-bold group hover:text-ficsit-orange"
        >
          <Wand2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Wizard</span>
        </button>

        <div className="w-px bg-gray-700 h-6 my-auto" />

        <button
          type="button"
          onClick={layoutNodes}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-bold group hover:text-ficsit-orange"
        >
          <Network className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Layout</span>
        </button>

        <div className="w-px bg-gray-700 h-6 my-auto" />

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-bold group hover:text-ficsit-orange"
        >
          <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Share</span>
        </button>
      </div>

      {showWizard && <ProductionWizard onClose={() => setShowWizard(false)} />}
    </>
  );
}

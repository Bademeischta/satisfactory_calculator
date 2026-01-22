import React from 'react';
import { useFactoryStore } from '@/store/useFactoryStore';
import { Trash2, Network } from 'lucide-react';

export function Toolbar() {
  const clearFactory = useFactoryStore((state) => state.clearFactory);
  const layoutNodes = useFactoryStore((state) => state.layoutNodes);

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

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#141414]/90 backdrop-blur-sm border border-ficsit-grey rounded-full px-6 py-2 shadow-xl z-50 flex gap-4">
      <button
        type="button"
        onClick={handleClear}
        className="flex items-center gap-2 text-white hover:text-red-500 transition-colors text-sm font-bold group"
      >
        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>Clear Factory</span>
      </button>

      <div className="w-px bg-gray-700 h-6 my-auto" />

      <button
        type="button"
        onClick={layoutNodes}
        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-bold group hover:text-ficsit-orange"
      >
        <Network className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span>Auto-Layout</span>
      </button>
    </div>
  );
}

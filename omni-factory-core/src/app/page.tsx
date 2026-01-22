'use client';

import React from 'react';
import FactoryCanvas from '@/components/organisms/FactoryCanvas';
import { useFactoryStore } from '@/store/useFactoryStore';

export default function Home() {
  const addNode = useFactoryStore((state) => state.addNode);

  const handleAddSmelter = () => {
    // Add a Smelter at a random position near center
    addNode('recipe_iron_ingot', {
        x: Math.random() * 400,
        y: Math.random() * 400
    });
  };

  const handleAddConstructor = () => {
      addNode('recipe_iron_plate', {
          x: Math.random() * 400 + 400,
          y: Math.random() * 400
      });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      {/* Full Screen Canvas */}
      <div className="w-full h-screen relative">
        <FactoryCanvas />

        {/* Floating UI for Testing */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
            <button
                type="button"
                onClick={handleAddSmelter}
                className="bg-ficsit-orange text-black px-4 py-2 rounded shadow-lg font-bold hover:bg-white transition-colors"
            >
                + Add Smelter
            </button>
             <button
                type="button"
                onClick={handleAddConstructor}
                className="bg-ficsit-grey text-white border border-ficsit-orange px-4 py-2 rounded shadow-lg font-bold hover:bg-ficsit-dark transition-colors"
            >
                + Add Constructor
            </button>
        </div>
      </div>
    </main>
  );
}

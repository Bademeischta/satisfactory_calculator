'use client';

import React from 'react';
import FactoryCanvas from '@/components/organisms/FactoryCanvas';
import { NodePalette } from '@/components/organisms/NodePalette';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-row">
      <NodePalette />

      {/* Full Screen Canvas */}
      <div className="flex-1 h-screen relative">
        <FactoryCanvas />
      </div>
    </main>
  );
}

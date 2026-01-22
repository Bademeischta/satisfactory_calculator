'use client';

import React from 'react';
import FactoryCanvas from '@/components/organisms/FactoryCanvas';
import { BuilderSidebar } from '@/components/organisms/BuilderSidebar';
import { PropertyPanel } from '@/components/organisms/PropertyPanel';
import { FactoryStats } from '@/components/organisms/FactoryStats';
import { Toolbar } from '@/components/molecules/Toolbar';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-row">
      {/* Left: Builder Sidebar */}
      <BuilderSidebar />

      {/* Center: Canvas */}
      <div className="flex-1 h-screen relative">
        <FactoryCanvas />
        <FactoryStats />
        <Toolbar />
      </div>

      {/* Right: Property Panel */}
      <PropertyPanel />
    </main>
  );
}

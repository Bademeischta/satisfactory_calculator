import React from 'react';
import { useFactoryStore } from '@/store/useFactoryStore';
import { Zap, Package, Cpu } from 'lucide-react';

export function FactoryStats() {
  const simulation = useFactoryStore((state) => state.simulation);
  const nodeCount = useFactoryStore((state) => state.nodes.length);

  const totalPower = simulation?.totalPower || 0;
  // Sum of output flow rates? Or specific objective value?
  // "Number of items produced per minute" -> tricky without definition of "produced".
  // Let's sum the output flow of all nodes for now, or just leave it as a placeholder.
  // Better: Sum of all edge flows (Transport Rate).
  const totalTransport = simulation
    ? Object.values(simulation.edges).reduce((acc, e) => acc + e.flowRate, 0)
    : 0;

  return (
    <div className="absolute top-4 right-4 bg-[#141414]/90 backdrop-blur-sm border border-ficsit-grey rounded-lg p-4 shadow-xl z-50 w-64">
      <h3 className="text-xs font-bold uppercase text-gray-400 mb-3 border-b border-gray-700 pb-2">
        Factory Metrics
      </h3>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-white text-sm">
            <Zap className="w-4 h-4 text-ficsit-orange" />
            <span>Power</span>
          </div>
          <span className="font-mono text-ficsit-orange font-bold">
            {totalPower.toFixed(1)} <span className="text-xs text-gray-500">MW</span>
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-white text-sm">
            <Package className="w-4 h-4 text-blue-400" />
            <span>Transport</span>
          </div>
          <span className="font-mono text-white font-bold">
            {totalTransport.toFixed(0)} <span className="text-xs text-gray-500">/m</span>
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-white text-sm">
            <Cpu className="w-4 h-4 text-green-400" />
            <span>Machines</span>
          </div>
          <span className="font-mono text-white font-bold">{nodeCount}</span>
        </div>
      </div>
    </div>
  );
}

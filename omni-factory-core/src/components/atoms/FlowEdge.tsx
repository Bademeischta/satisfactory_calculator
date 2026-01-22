import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';
import { useFactoryStore } from '@/store/useFactoryStore';
import { useStore } from '@/hooks/useStore';

interface FlowEdgeData {
  flowRate: number;
  isRecycled?: boolean;
}

function FlowEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<FlowEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const globalBeltTier = useStore(useFactoryStore, (state) => state.globalBeltTier) || 5;

  const flowRate = data?.flowRate || 0;

  // Calculate Limit based on Global Tier Selection
  let limit = 780;
  if (globalBeltTier === 1) limit = 60;
  if (globalBeltTier === 2) limit = 120;
  if (globalBeltTier === 3) limit = 270;
  if (globalBeltTier === 4) limit = 480;
  if (globalBeltTier === 5) limit = 780;

  const utilization = flowRate / limit;

  // Determine Belt Tier
  let tierLabel = '';
  if (flowRate <= 60) tierLabel = 'Mk.1';
  else if (flowRate <= 120) tierLabel = 'Mk.2';
  else if (flowRate <= 270) tierLabel = 'Mk.3';
  else if (flowRate <= 480) tierLabel = 'Mk.4';
  else if (flowRate <= 780) tierLabel = 'Mk.5';
  else tierLabel = 'Mk.6+';

  // Visual Logic
  let strokeColor = '#555'; // Default inactive
  let strokeWidth = 2;
  let strokeDasharray = '5,5';

  if (data?.isRecycled) {
    strokeColor = '#00FFFF'; // Cyan for Recycled Loops
    strokeWidth = 3;
    strokeDasharray = 'none'; // Loops are always active conceptually
  } else if (flowRate > 0) {
    strokeDasharray = 'none';

    if (utilization >= 1.0) {
      // Bottleneck / Full
      strokeColor = '#EF4444'; // Red-500
      strokeWidth = 4;
    } else if (utilization > 0.9) {
      // High Load
      strokeColor = '#F97316'; // Orange-500
      strokeWidth = 3;
    } else if (utilization < 0.5) {
      // Low Load (Grey/Whiteish)
      strokeColor = '#9CA3AF'; // Gray-400
      strokeWidth = 2;
    } else {
      // Normal Load (FICSIT Orange)
      strokeColor = '#FA9549';
      strokeWidth = 3;
    }
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth,
          stroke: strokeColor,
          strokeDasharray,
          // Standard React Flow animation relies on the 'animated' prop on the component,
          // but BaseEdge styles can also set animation if we define keyframes.
          // Since we can't easily inject keyframes here without styled-components or global CSS,
          // we rely on the stroke color and width to convey status.
          // The pulsing effect for bottleneck would require CSS classes.
          opacity: utilization >= 1.0 ? 1 : 0.8,
        }}
      />
      {/* Edge Label for Flow Rate */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className={`
             px-2 py-1 rounded-full shadow-md border font-bold text-[10px] flex items-center gap-1
             ${flowRate > 0
                ? 'bg-ficsit-dark text-white border-ficsit-orange'
                : 'bg-gray-800 text-gray-500 border-gray-600'}
             ${utilization >= 1.0 ? '!border-red-500 !bg-red-900/50 !text-red-200' : ''}
          `}>
            <span>{flowRate.toFixed(1)}</span>
            <span className="text-[8px] opacity-70">/ {limit}</span>
            {flowRate > 0 && <span className="bg-white/20 px-1 rounded text-[8px] ml-1">{tierLabel}</span>}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(FlowEdge);

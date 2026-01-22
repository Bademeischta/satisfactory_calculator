import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from 'reactflow';

interface FlowEdgeData {
  flowRate: number;
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

  const flowRate = data?.flowRate || 0;
  const isFlowing = flowRate > 0;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isFlowing ? 3 : 2,
          stroke: isFlowing ? '#FA9549' : '#555',
          strokeDasharray: isFlowing ? 'none' : '5,5',
          animation: isFlowing ? 'dashdraw 0.5s linear infinite' : 'none',
          // Note: Standard SVG animation for dashoffset is complex in inline style without global CSS keyframes.
          // React Flow edges usually support 'animated' prop for basic dash animation.
          // But we want custom "conveyor belt" look.
          // For now, let's rely on color and dasharray.
          // If we pass `animated: true` in standard Edge, it animates the dash.
          // We can simulate motion later if needed.
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
             px-2 py-1 rounded-full shadow-md border font-bold text-[10px]
             ${isFlowing
                ? 'bg-ficsit-dark text-ficsit-orange border-ficsit-orange'
                : 'bg-gray-800 text-gray-500 border-gray-600'}
          `}>
            {flowRate.toFixed(1)}/m
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(FlowEdge);

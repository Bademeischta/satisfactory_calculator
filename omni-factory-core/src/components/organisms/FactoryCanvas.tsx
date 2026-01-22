import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFactoryStore } from '@/store/useFactoryStore';
import FactoryNode from '@/components/molecules/FactoryNode';
import { useSolver } from '@/hooks/useSolver';

// Define node types outside component to prevent re-creation
const nodeTypes: NodeTypes = {
  factoryNode: FactoryNode,
};

function FactoryCanvas() {
  const {
    nodes, edges, connectNodes, removeNode, updateNodePosition,
  } = useFactoryStore();

  // Activate the Solver
  useSolver();

  // Map Zustand store nodes to React Flow nodes
  const flowNodes: Node[] = useMemo(() => nodes.map((node) => ({
    id: node.id,
    type: 'factoryNode',
    position: node.position,
    data: {
      recipeId: node.recipeId,
      clockSpeed: node.clockSpeed,
    },
  })), [nodes]);

  // Map Zustand store edges to React Flow edges
  const flowEdges: Edge[] = useMemo(() => edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    sourceHandle: edge.itemSlug, // We used itemSlug as handle ID in FactoryNode
    targetHandle: edge.itemSlug,
    animated: true,
    style: { stroke: '#FA9549', strokeWidth: 2 },
  })), [edges]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target && params.sourceHandle) {
        // sourceHandle is the itemSlug
        connectNodes(params.source, params.target, params.sourceHandle);
    }
  }, [connectNodes]);


  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
      nodesToDelete.forEach((node) => {
          removeNode(node.id);
      });
  }, [removeNode]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // We only care about position changes for the store
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
            updateNodePosition(change.id, change.position);
        }
      });
    },
    [updateNodePosition]
  );

  return (
    <div className="w-full h-full bg-ficsit-dark">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onNodesChange={onNodesChange}
        fitView
      >
        <Background color="#333" gap={16} size={1} />
        <Controls className="bg-white text-black" />
        <MiniMap
            nodeColor="#FA9549"
            maskColor="rgba(30, 30, 30, 0.8)"
            className="bg-ficsit-dark border border-ficsit-grey"
        />
      </ReactFlow>
    </div>
  );
};

export default FactoryCanvas;

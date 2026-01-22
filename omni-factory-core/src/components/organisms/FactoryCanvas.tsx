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
  EdgeTypes,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFactoryStore } from '@/store/useFactoryStore';
import FactoryNode from '@/components/molecules/FactoryNode';
import FlowEdge from '@/components/atoms/FlowEdge';
import { useFactorySimulation } from '@/hooks/useFactorySimulation';

// Define node and edge types outside component to prevent re-creation
const nodeTypes: NodeTypes = {
  factoryNode: FactoryNode,
};

const edgeTypes: EdgeTypes = {
  flowEdge: FlowEdge,
};

function FactoryCanvas() {
  const {
    nodes, edges, connectNodes, removeNode, updateNodePosition, addNode,
  } = useFactoryStore();

  // Activate the Solver
  useFactorySimulation();

  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);

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
    type: 'flowEdge',
    animated: edge.flowRate > 0, // Fallback for standard edge if type fails, but FlowEdge handles visual
    data: { flowRate: edge.flowRate },
  })), [edges]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target && params.sourceHandle) {
        // sourceHandle is the itemSlug
        connectNodes(params.source, params.target, params.sourceHandle);
    }
  }, [connectNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    // eslint-disable-next-line no-param-reassign
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const recipeId = event.dataTransfer.getData('application/reactflow');
      if (!recipeId) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(recipeId, position);
    },
    [reactFlowInstance, addNode],
  );


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
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onNodesChange={onNodesChange}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
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

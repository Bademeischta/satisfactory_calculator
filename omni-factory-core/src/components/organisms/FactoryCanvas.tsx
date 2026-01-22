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
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFactoryStore } from '@/store/useFactoryStore';
import { useStore } from '@/hooks/useStore';
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
  const store = useStore(useFactoryStore, (state) => state);

  // Use useMemo to stabilize the array reference if store changes but nodes/edges arrays are new instances
  // Actually, useStore returns a new object on every store update.
  // The correct fix for the linter warning is to not rely on logical OR inside the useMemo dependency array.
  // We can just trust useStore's return value or memoize the extraction.

  const nodes = React.useMemo(() => store?.nodes || [], [store?.nodes]);
  const edges = React.useMemo(() => store?.edges || [], [store?.edges]);

  // Actions usually don't need hydration safety as they are functions, but we get them from the safe store or direct.
  // Actually, actions are stable. We can access them directly from the hook or the store.
  // But to be consistent and safe, we can pull them from the store hook if possible, or just use the non-hook usage for actions.
  // However, useStore returns the state.
  // Let's grab actions directly as they don't cause hydration mismatch (they are functions).
  // const {
  //   connectNodes, removeNode, updateNodePosition, addNode, selectNode,
  // } = useFactoryStore.getState();
  // Wait, relying on getState() inside render might be risky if we expect updates.
  // But actions don't change.
  // Better pattern: useFactoryStore(state => state.action) is fine.
  // The hydration issue is about DATA.

  // Let's use the hook for data, and standard hook for actions?
  // Or just check if store is defined.

  // Use useFactoryStore directly for actions to keep it clean,
  // assuming actions are not part of the hydration mismatch problem (they aren't serialized).
  const connectNodesAction = useFactoryStore((s) => s.connectNodes);
  const removeNodeAction = useFactoryStore((s) => s.removeNode);
  const updateNodePositionAction = useFactoryStore((s) => s.updateNodePosition);
  const addNodeAction = useFactoryStore((s) => s.addNode);
  const selectNodeAction = useFactoryStore((s) => s.selectNode);

  // Activate the Solver
  useFactorySimulation();

  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);

  // Map Zustand store nodes to React Flow nodes
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        connectNodesAction(params.source, params.target, params.sourceHandle);
    }
  }, [connectNodesAction]);

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

      addNodeAction(recipeId, position);
    },
    [reactFlowInstance, addNodeAction],
  );

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    // We only care about single node selection for the property panel for now
    if (params.nodes.length > 0) {
        selectNodeAction(params.nodes[0].id);
    } else {
        selectNodeAction(null);
    }
  }, [selectNodeAction]);

  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
      nodesToDelete.forEach((node) => {
          removeNodeAction(node.id);
      });
  }, [removeNodeAction]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // We only care about position changes for the store
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
            updateNodePositionAction(change.id, change.position);
        }
      });
    },
    [updateNodePositionAction]
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
        onSelectionChange={onSelectionChange}
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

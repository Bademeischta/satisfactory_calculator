import LZString from 'lz-string';
import { FactoryNode, FactoryEdge } from '@/types/factory';

// Helper interfaces for minified data
interface MinifiedNode {
  i: string; // id
  p: [number, number]; // position [x, y]
  r: string; // recipeId
  c?: number; // clockSpeed (optional if 1.0)
  t?: number; // machineTier
  o?: number; // targetOutput
  pr?: number; // priority
}

interface MinifiedEdge {
  i: string; // id
  s: string; // sourceNodeId
  sh: string; // sourceHandle
  t: string; // targetNodeId
  th: string; // targetHandle
  l?: number; // limitRate
}

export interface CompressedState {
  n: MinifiedNode[];
  e: MinifiedEdge[];
}

export function compressState(nodes: FactoryNode[], edges: FactoryEdge[]): string {
  const minNodes: MinifiedNode[] = nodes.map(n => ({
    i: n.id,
    p: [Math.round(n.position.x), Math.round(n.position.y)], // Integer positions
    r: n.recipeId,
    c: n.clockSpeed === 1.0 ? undefined : n.clockSpeed,
    t: n.machineTier,
    o: n.targetOutput,
    pr: n.priority
  }));

  const minEdges: MinifiedEdge[] = edges.map(e => ({
    i: e.id,
    s: e.sourceNodeId,
    sh: e.sourceHandle,
    t: e.targetNodeId,
    th: e.targetHandle,
    l: e.limitRate
  }));

  const data: CompressedState = { n: minNodes, e: minEdges };
  return LZString.compressToEncodedURIComponent(JSON.stringify(data));
}

export function decompressState(hash: string): { nodes: FactoryNode[], edges: FactoryEdge[] } | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return null;

    const data = JSON.parse(json);
    if (!data.n || !data.e) return null;

    const nodes: FactoryNode[] = data.n.map((n: MinifiedNode) => ({
      id: n.i,
      position: { x: n.p[0], y: n.p[1] },
      recipeId: n.r,
      clockSpeed: n.c ?? 1.0,
      machineTier: n.t,
      targetOutput: n.o,
      priority: n.pr
    }));

    const edges: FactoryEdge[] = data.e.map((e: MinifiedEdge) => ({
      id: e.i,
      sourceNodeId: e.s,
      sourceHandle: e.sh,
      targetNodeId: e.t,
      targetHandle: e.th,
      limitRate: e.l
    }));

    return { nodes, edges };
  } catch {
    // Silent fail on invalid state
    return null;
  }
}

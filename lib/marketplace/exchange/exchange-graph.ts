/**
 * Exchange graph architecture — Phase 4D.
 * Prepares A→B and future A→B→C→D chains. No chain matching execution.
 */

import type { ExchangeMatchType } from './exchange-match-types';
import type { ExchangeListingProfile } from './exchange-contract';

export const EXCHANGE_GRAPH_MAX_CHAIN_LENGTH = 4 as const;

export type ExchangeGraphNode = {
  id: string;
  listingId: string;
  userId: string;
  profile: ExchangeListingProfile;
};

export type ExchangeGraphEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromListingId: string;
  toListingId: string;
  matchType: ExchangeMatchType;
  score: number;
  /** Directed: offerer → wanter for desired match edges */
  direction: 'bidirectional' | 'offer_to_want';
};

export type ExchangeGraph = {
  specVersion: 1;
  nodes: ExchangeGraphNode[];
  edges: ExchangeGraphEdge[];
  meta: {
    nodeCount: number;
    edgeCount: number;
    maxChainLength: number;
    chainMatchingEnabled: false;
  };
};

export type ExchangeChainPath = {
  nodeIds: string[];
  listingIds: string[];
  userIds: string[];
  edgeIds: string[];
  length: number;
};

export function graphNodeId(listingId: string): string {
  return `exg-node:${listingId}`;
}

export function graphEdgeId(fromListingId: string, toListingId: string): string {
  return `exg-edge:${fromListingId}:${toListingId}`;
}

export function buildExchangeGraph(input: {
  profiles: ExchangeListingProfile[];
  edges: Omit<ExchangeGraphEdge, 'id'>[];
}): ExchangeGraph {
  const nodes: ExchangeGraphNode[] = input.profiles.map((profile) => ({
    id: graphNodeId(profile.listingId),
    listingId: profile.listingId,
    userId: profile.userId,
    profile,
  }));

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: ExchangeGraphEdge[] = [];

  for (const edge of input.edges) {
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) continue;
    if (edge.fromNodeId === edge.toNodeId) continue;
    edges.push({
      ...edge,
      id: graphEdgeId(edge.fromListingId, edge.toListingId),
    });
  }

  return {
    specVersion: 1,
    nodes,
    edges: dedupeGraphEdges(edges),
    meta: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      maxChainLength: EXCHANGE_GRAPH_MAX_CHAIN_LENGTH,
      chainMatchingEnabled: false,
    },
  };
}

export function dedupeGraphEdges(edges: ExchangeGraphEdge[]): ExchangeGraphEdge[] {
  const seen = new Set<string>();
  const out: ExchangeGraphEdge[] = [];
  for (const edge of edges) {
    const key = `${edge.fromListingId}:${edge.toListingId}:${edge.matchType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(edge);
  }
  return out;
}

/** Validate graph integrity — no self-loops, unique node ids. */
export function validateExchangeGraphIntegrity(
  graph: ExchangeGraph,
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const nodeIds = new Set<string>();

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) violations.push(`duplicate_node:${node.id}`);
    nodeIds.add(node.id);
  }

  for (const edge of graph.edges) {
    if (edge.fromNodeId === edge.toNodeId) {
      violations.push(`self_loop:${edge.id}`);
    }
    if (!nodeIds.has(edge.fromNodeId)) {
      violations.push(`orphan_edge_from:${edge.id}`);
    }
    if (!nodeIds.has(edge.toNodeId)) {
      violations.push(`orphan_edge_to:${edge.id}`);
    }
  }

  if (graph.meta.chainMatchingEnabled !== false) {
    violations.push('chain_matching_must_be_disabled');
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Placeholder for Phase 4F — enumerate simple paths up to max length.
 * Returns empty in 4D (architecture only).
 */
export function findExchangeChainPaths(
  _graph: ExchangeGraph,
  _maxLength = EXCHANGE_GRAPH_MAX_CHAIN_LENGTH,
): ExchangeChainPath[] {
  return [];
}

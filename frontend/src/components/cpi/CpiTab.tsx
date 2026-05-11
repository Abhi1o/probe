'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  GitBranch, AlertTriangle, CheckCircle, RefreshCw,
  ArrowRight, ArrowLeft, Shield, Zap, Info,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CpiNode {
  programId: string;
  label: string;
  isMonitored: boolean;
  isYourProgram: boolean;
  invocationCount: number;
  successRate: number;
  isKnownProgram: boolean;
}

interface CpiEdge {
  id: string;
  callerProgramId: string;
  calleeProgramId: string;
  callerLabel: string;
  calleeLabel: string;
  invocationCount: number;
  successCount: number;
  failureCount: number;
  failureRate: number;
  avgComputeUnits: number;
  maxDepth: number;
  lastInvoked: string;
}

interface RiskReport {
  totalRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  breakdown: {
    dependencyBreadth: { score: number; count: number };
    failureInheritance: { score: number; avgCalleeFailureRate: number };
    nestingDepth: { score: number; maxDepth: number };
  };
  recommendations: string[];
  outgoingEdges: number;
  incomingEdges: number;
}

interface CpiGraph {
  nodes: CpiNode[];
  edges: CpiEdge[];
  riskReport: RiskReport;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskColor(level: string) {
  switch (level) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-green-600 bg-green-50 border-green-200';
  }
}

function nodeColor(node: CpiNode): string {
  if (node.isYourProgram) return '#6366f1'; // indigo — your program
  if (node.successRate < 0.9) return '#ef4444'; // red — high failure
  if (!node.isKnownProgram) return '#f59e0b'; // amber — unknown
  return '#22c55e'; // green — known + healthy
}

function edgeColor(failureRate: number): string {
  if (failureRate > 0.1) return '#ef4444';
  if (failureRate > 0.03) return '#f59e0b';
  return '#94a3b8';
}

// ─── SVG Force-Layout Graph ───────────────────────────────────────────────────
// Simple circular layout — no D3 needed

function CpiGraph({ nodes, edges, yourProgramId }: {
  nodes: CpiNode[];
  edges: CpiEdge[];
  yourProgramId: string;
}) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
        <GitBranch className="h-10 w-10 opacity-40" />
        <p className="text-sm">No CPI data yet. Click &quot;Extract CPI&quot; to analyze transactions.</p>
      </div>
    );
  }

  const W = 700;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2;

  // Place your program in center, others in a circle around it
  const others = nodes.filter(n => !n.isYourProgram);
  const yourNode = nodes.find(n => n.isYourProgram);

  const positions = new Map<string, { x: number; y: number }>();

  if (yourNode) {
    positions.set(yourNode.programId, { x: cx, y: cy });
  }

  const radius = Math.min(160, Math.max(100, others.length * 18));
  others.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / others.length - Math.PI / 2;
    positions.set(node.programId, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-xl border bg-muted/20"
        style={{ maxHeight: 420 }}
      >
        {/* Edges */}
        {edges.map(edge => {
          const from = positions.get(edge.callerProgramId);
          const to = positions.get(edge.calleeProgramId);
          if (!from || !to) return null;

          const isHovered = hoveredEdge === edge.id;
          const strokeWidth = Math.max(1, Math.min(6, Math.log10(edge.invocationCount + 1) * 2));
          const color = edgeColor(edge.failureRate);

          // Arrow midpoint
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;

          return (
            <g key={edge.id}>
              <line
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                strokeOpacity={isHovered ? 1 : 0.6}
                strokeDasharray={edge.failureRate > 0.05 ? '6 3' : undefined}
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge(null)}
                style={{ cursor: 'pointer' }}
              />
              {/* Arrow head */}
              <circle cx={mx} cy={my} r={3} fill={color} opacity={0.8} />
              {/* Invocation count label on hover */}
              {isHovered && (
                <text x={mx + 6} y={my - 4} fontSize={10} fill={color} fontWeight="600">
                  {formatNumber(edge.invocationCount)} calls
                  {edge.failureRate > 0 ? ` · ${(edge.failureRate * 100).toFixed(1)}% fail` : ''}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const pos = positions.get(node.programId);
          if (!pos) return null;

          const isHovered = hoveredNode === node.programId;
          const r = node.isYourProgram ? 28 : Math.max(14, Math.min(22, Math.log10(node.invocationCount + 1) * 7));
          const color = nodeColor(node);

          return (
            <g
              key={node.programId}
              onMouseEnter={() => setHoveredNode(node.programId)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow ring on hover */}
              {isHovered && (
                <circle cx={pos.x} cy={pos.y} r={r + 6} fill={color} opacity={0.15} />
              )}
              {/* Node circle */}
              <circle
                cx={pos.x} cy={pos.y} r={r}
                fill={color}
                stroke={node.isYourProgram ? '#4f46e5' : 'white'}
                strokeWidth={node.isYourProgram ? 3 : 1.5}
                opacity={0.9}
              />
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + r + 14}
                textAnchor="middle"
                fontSize={node.isYourProgram ? 11 : 9}
                fontWeight={node.isYourProgram ? '700' : '500'}
                fill="currentColor"
                className="fill-foreground"
              >
                {node.label.length > 16 ? node.label.slice(0, 14) + '…' : node.label}
              </text>
              {/* Invocation count inside node */}
              {node.invocationCount > 0 && (
                <text
                  x={pos.x} y={pos.y + 4}
                  textAnchor="middle"
                  fontSize={node.isYourProgram ? 10 : 8}
                  fontWeight="600"
                  fill="white"
                >
                  {node.invocationCount > 999 ? `${(node.invocationCount / 1000).toFixed(1)}k` : node.invocationCount}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-indigo-500 inline-block" />Your Program</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500 inline-block" />Known + Healthy</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />Unknown Program</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500 inline-block" />High Failure Rate</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-6 border-t-2 border-dashed border-red-400 inline-block" />Failing Edge</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CpiTabProps {
  programDbId: string;
}

export function CpiTab({ programDbId }: CpiTabProps) {
  const { data, isLoading, refetch, isRefetching } = useQuery<CpiGraph>({
    queryKey: ['cpi', 'graph', programDbId],
    queryFn: async () => (await apiClient.get(`/programs/${programDbId}/cpi/graph`)).data,
    enabled: !!programDbId,
    staleTime: 5 * 60 * 1000,
  });

  const extractMutation = useMutation({
    mutationFn: async () => apiClient.post(`/programs/${programDbId}/cpi/extract`),
    onSuccess: () => refetch(),
  });

  const graph = data;
  const risk = graph?.riskReport;
  const outgoing = graph?.edges.filter(e => {
    const yourNode = graph.nodes.find(n => n.isYourProgram);
    return yourNode && e.callerProgramId === yourNode.programId;
  }) ?? [];
  const incoming = graph?.edges.filter(e => {
    const yourNode = graph.nodes.find(n => n.isYourProgram);
    return yourNode && e.calleeProgramId === yourNode.programId;
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Cross-Program Invocation (CPI) Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unique to Solana — shows which programs your program calls and which call it
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => extractMutation.mutate()}
            disabled={extractMutation.isPending}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${extractMutation.isPending ? 'animate-spin' : ''}`} />
            Extract CPI
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Risk Score */}
      {risk && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className={`border ${riskColor(risk.riskLevel)}`}>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs font-medium opacity-70">CPI Risk Score</p>
              <p className="text-2xl font-bold mt-0.5">{risk.totalRiskScore}/100</p>
              <Badge variant="outline" className={`mt-1 text-xs ${riskColor(risk.riskLevel)}`}>
                {risk.riskLevel.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Outgoing CPIs</p>
              <p className="text-2xl font-bold mt-0.5">{risk.outgoingEdges}</p>
              <p className="text-xs text-muted-foreground">programs called</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Incoming CPIs</p>
              <p className="text-2xl font-bold mt-0.5">{risk.incomingEdges}</p>
              <p className="text-xs text-muted-foreground">programs calling you</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">Max Depth</p>
              <p className="text-2xl font-bold mt-0.5">{risk.breakdown.nestingDepth.maxDepth}</p>
              <p className="text-xs text-muted-foreground">nesting levels</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graph */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Dependency Graph</CardTitle>
          <CardDescription className="text-xs">
            Node size = invocation count · Edge thickness = frequency · Dashed = failing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <CpiGraph
              nodes={graph?.nodes ?? []}
              edges={graph?.edges ?? []}
              yourProgramId={programDbId}
            />
          )}
        </CardContent>
      </Card>

      {/* Outgoing CPIs table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ArrowRight className="h-4 w-4 text-primary" />
            Outgoing CPIs — Programs You Call
          </CardTitle>
          <CardDescription className="text-xs">
            Your program invokes these programs. Their failures can cascade to your users.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : outgoing.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              No outgoing CPIs detected yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Called Program</TableHead>
                    <TableHead className="text-xs text-right">Invocations</TableHead>
                    <TableHead className="text-xs text-right">Success Rate</TableHead>
                    <TableHead className="text-xs text-right">Failure Rate</TableHead>
                    <TableHead className="text-xs text-right">Max Depth</TableHead>
                    <TableHead className="text-xs">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outgoing.sort((a, b) => b.invocationCount - a.invocationCount).map(edge => (
                    <TableRow key={edge.id}>
                      <TableCell className="text-xs font-medium">{edge.calleeLabel}</TableCell>
                      <TableCell className="text-right text-xs">{formatNumber(edge.invocationCount)}</TableCell>
                      <TableCell className="text-right text-xs">
                        <span className={edge.failureRate > 0.05 ? 'text-red-600' : 'text-green-600'}>
                          {((1 - edge.failureRate) * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <span className={edge.failureRate > 0.05 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                          {(edge.failureRate * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">{edge.maxDepth}</TableCell>
                      <TableCell>
                        {edge.failureRate > 0.1 ? (
                          <Badge variant="destructive" className="text-xs">High</Badge>
                        ) : edge.failureRate > 0.03 ? (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">Medium</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Low</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incoming CPIs table */}
      {incoming.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              Incoming CPIs — Programs That Call You
            </CardTitle>
            <CardDescription className="text-xs">
              These programs invoke your program. Unexpected callers may indicate security risks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Caller Program</TableHead>
                    <TableHead className="text-xs text-right">Invocations</TableHead>
                    <TableHead className="text-xs text-right">Success Rate</TableHead>
                    <TableHead className="text-xs">Known</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incoming.sort((a, b) => b.invocationCount - a.invocationCount).map(edge => {
                    const callerNode = graph?.nodes.find(n => n.programId === edge.callerProgramId);
                    return (
                      <TableRow key={edge.id}>
                        <TableCell className="text-xs font-medium">{edge.callerLabel}</TableCell>
                        <TableCell className="text-right text-xs">{formatNumber(edge.invocationCount)}</TableCell>
                        <TableCell className="text-right text-xs">
                          {((1 - edge.failureRate) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {callerNode?.isKnownProgram ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {risk && risk.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4" />
              CPI Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {risk.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
                  <span className="mt-0.5 flex-shrink-0">→</span>
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CpiTab;

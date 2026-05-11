'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertTriangle, RefreshCw, ExternalLink, Shield,
  TrendingDown, Zap, Users, Info,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatNumber, formatAddress, formatRelativeTime } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MevEventRow {
  id: string;
  mevType: string;
  severity: string;
  attackerWallet: string | null;
  victimWallet: string | null;
  estimatedLostSol: number;
  estimatedProfitSol: number;
  description: string | null;
  detectedAt: string;
  victimSignature: string | null;
}

interface MevSummary {
  programId: string;
  totalEvents: number;
  totalEstimatedLostSol: number;
  byType: Record<string, { count: number; estimatedLostSol: number }>;
  topAttackers: { wallet: string; count: number; estimatedProfitSol: number }[];
  topVictims: { wallet: string; count: number; estimatedLostSol: number }[];
  recentEvents: MevEventRow[];
  vulnerabilityScore: number;
  recommendations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MEV_TYPE_COLORS: Record<string, string> = {
  sandwich: '#ef4444',
  frontrun: '#f97316',
  backrun: '#f59e0b',
  arbitrage: '#8b5cf6',
  jit_liquidity: '#3b82f6',
};

const MEV_TYPE_LABELS: Record<string, string> = {
  sandwich: 'Sandwich Attack',
  frontrun: 'Front-Running',
  backrun: 'Back-Running',
  arbitrage: 'Arbitrage / Bot',
  jit_liquidity: 'JIT Liquidity',
};

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[severity] ?? colors.low}`}>
      {severity}
    </span>
  );
}

function VulnerabilityGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
  const label = score >= 70 ? 'High Risk' : score >= 40 ? 'Medium Risk' : 'Low Risk';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="32"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 201} 201`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MevTabProps {
  programDbId: string;
}

export function MevTab({ programDbId }: MevTabProps) {
  const { data, isLoading, refetch, isRefetching } = useQuery<MevSummary>({
    queryKey: ['mev', programDbId],
    queryFn: async () => (await apiClient.get(`/programs/${programDbId}/mev/summary`)).data,
    enabled: !!programDbId,
    staleTime: 5 * 60 * 1000,
  });

  const detectMutation = useMutation({
    mutationFn: async () => apiClient.post(`/programs/${programDbId}/mev/detect`),
    onSuccess: () => refetch(),
  });

  // Build bar chart data
  const chartData = data ? Object.entries(data.byType).map(([type, stats]) => ({
    name: MEV_TYPE_LABELS[type] ?? type,
    count: stats.count,
    lostSol: parseFloat(stats.estimatedLostSol.toFixed(4)),
    color: MEV_TYPE_COLORS[type] ?? '#94a3b8',
  })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            MEV Detection & Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sandwich attacks, front-running, and bot activity affecting your program&apos;s users
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => detectMutation.mutate()}
            disabled={detectMutation.isPending}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${detectMutation.isPending ? 'animate-spin' : ''}`} />
            Run Detection
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Total MEV Events</p>
                <p className="text-2xl font-bold">{formatNumber(data?.totalEvents)}</p>
                <p className="text-xs text-muted-foreground">last 30 days</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Est. User Losses</p>
                <p className="text-2xl font-bold text-red-600">
                  {(data?.totalEstimatedLostSol ?? 0).toFixed(4)} SOL
                </p>
                <p className="text-xs text-muted-foreground">extracted from users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Unique Attackers</p>
                <p className="text-2xl font-bold">{data?.topAttackers.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">distinct wallets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-1">Vulnerability</p>
                <VulnerabilityGauge score={data?.vulnerabilityScore ?? 0} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* MEV by Type Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">MEV Events by Type</CardTitle>
            <CardDescription className="text-xs">Distribution of MEV activity in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => [
                    name === 'count' ? `${v} events` : `${v} SOL`,
                    name === 'count' ? 'Events' : 'Est. Lost',
                  ]}
                />
                <Bar dataKey="count" name="count" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Attackers + Victims */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Attackers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Top MEV Extractors
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (data?.topAttackers.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-green-500" />
                No MEV extractors detected
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Wallet</TableHead>
                    <TableHead className="text-xs text-right">Events</TableHead>
                    <TableHead className="text-xs text-right">Est. Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.topAttackers.map((a, i) => (
                    <TableRow key={a.wallet}>
                      <TableCell className="font-mono text-xs">
                        <a
                          href={`https://solscan.io/account/${a.wallet}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-1"
                        >
                          {formatAddress(a.wallet, 6)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right text-xs">{a.count}</TableCell>
                      <TableCell className="text-right text-xs text-red-600">
                        {a.estimatedProfitSol.toFixed(4)} SOL
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Victims */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              Most Affected Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (data?.topVictims.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
                <Users className="h-4 w-4" />
                No victims detected
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Wallet</TableHead>
                    <TableHead className="text-xs text-right">Times Hit</TableHead>
                    <TableHead className="text-xs text-right">Est. Lost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.topVictims.map(v => (
                    <TableRow key={v.wallet}>
                      <TableCell className="font-mono text-xs">
                        <a
                          href={`https://solscan.io/account/${v.wallet}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-1"
                        >
                          {formatAddress(v.wallet, 6)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right text-xs">{v.count}</TableCell>
                      <TableCell className="text-right text-xs text-orange-600">
                        {v.estimatedLostSol.toFixed(4)} SOL
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent MEV Events</CardTitle>
          <CardDescription className="text-xs">Latest detected MEV activity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (data?.recentEvents.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Shield className="h-10 w-10 text-green-500 opacity-60" />
              <p className="text-sm font-medium">No MEV events detected</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Click &quot;Run Detection&quot; to analyze your transactions for MEV patterns.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Attacker</TableHead>
                    <TableHead className="text-xs">Victim</TableHead>
                    <TableHead className="text-xs text-right">Est. Lost</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Tx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentEvents.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: MEV_TYPE_COLORS[e.mevType] ?? '#94a3b8' }}
                        >
                          {MEV_TYPE_LABELS[e.mevType] ?? e.mevType}
                        </span>
                      </TableCell>
                      <TableCell><SeverityBadge severity={e.severity} /></TableCell>
                      <TableCell className="font-mono text-xs">
                        {e.attackerWallet ? formatAddress(e.attackerWallet, 4) : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {e.victimWallet ? formatAddress(e.victimWallet, 4) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-red-600">
                        {e.estimatedLostSol > 0 ? `${e.estimatedLostSol.toFixed(6)} SOL` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(e.detectedAt)}
                      </TableCell>
                      <TableCell>
                        {e.victimSignature && (
                          <a
                            href={`https://explorer.solana.com/tx/${e.victimSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
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

      {/* Recommendations */}
      {(data?.recommendations.length ?? 0) > 0 && (
        <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4" />
              MEV Protection Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {data?.recommendations.map((r, i) => (
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

export default MevTab;

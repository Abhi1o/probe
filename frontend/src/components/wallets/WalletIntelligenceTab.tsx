'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, Bot, TrendingUp, Star, RefreshCw,
  ExternalLink, AlertTriangle, Zap, Activity,
} from 'lucide-react';
import { formatNumber, formatAddress } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletStats {
  totalTxCount: number;
  successRate: number;
  avgTxPerDay: number;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  daysSinceLastSeen: number;
}

interface WalletClassification {
  address: string;
  primaryLabel: string;
  labels: string[];
  confidence: number;
  stats: WalletStats;
  reasoning: string;
}

interface WalletSummary {
  programId: string;
  totalUniqueWallets: number;
  composition: {
    bots: number;
    whales: number;
    smartMoney: number;
    retail: number;
    fresh: number;
    dormant: number;
    botPercent: number;
    whalePercent: number;
  };
  topWallets: WalletClassification[];
  vipWallets: { address: string; txCount: number; successRate: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LABEL_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  bot: { color: 'text-red-600', bg: 'bg-red-100', icon: <Bot className="h-3.5 w-3.5" />, desc: 'High-frequency automated wallet' },
  whale: { color: 'text-purple-600', bg: 'bg-purple-100', icon: <TrendingUp className="h-3.5 w-3.5" />, desc: 'Power user with many transactions' },
  smart_money: { color: 'text-blue-600', bg: 'bg-blue-100', icon: <Star className="h-3.5 w-3.5" />, desc: 'High success rate, sophisticated trader' },
  retail: { color: 'text-green-600', bg: 'bg-green-100', icon: <Users className="h-3.5 w-3.5" />, desc: 'Standard retail user' },
  fresh: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <Zap className="h-3.5 w-3.5" />, desc: 'New wallet, limited history' },
  dormant: { color: 'text-gray-500', bg: 'bg-gray-100', icon: <Activity className="h-3.5 w-3.5" />, desc: 'Inactive for 90+ days' },
};

const PIE_COLORS = ['#ef4444', '#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#94a3b8'];

function LabelBadge({ label }: { label: string }) {
  const cfg = LABEL_CONFIG[label] ?? LABEL_CONFIG.retail;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}
      {label.replace('_', ' ')}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface WalletIntelligenceTabProps {
  programDbId: string;
}

export function WalletIntelligenceTab({ programDbId }: WalletIntelligenceTabProps) {
  const { data, isLoading, refetch, isRefetching } = useQuery<WalletSummary>({
    queryKey: ['wallet-intelligence', programDbId],
    queryFn: async () => (await apiClient.get(`/programs/${programDbId}/wallet-intelligence/summary`)).data,
    enabled: !!programDbId,
    staleTime: 5 * 60 * 1000,
  });

  const classifyMutation = useMutation({
    mutationFn: async () => apiClient.post(`/programs/${programDbId}/wallet-intelligence/classify`),
    onSuccess: () => refetch(),
  });

  const comp = data?.composition;

  // Build pie chart data
  const pieData = comp ? [
    { name: 'Bots', value: comp.bots },
    { name: 'Whales', value: comp.whales },
    { name: 'Smart Money', value: comp.smartMoney },
    { name: 'Retail', value: comp.retail },
    { name: 'Fresh', value: comp.fresh },
    { name: 'Dormant', value: comp.dormant },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Wallet Intelligence
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Who is using your program — bots, whales, smart money, and retail users
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => classifyMutation.mutate()}
            disabled={classifyMutation.isPending}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${classifyMutation.isPending ? 'animate-spin' : ''}`} />
            Classify Wallets
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
                <p className="text-xs text-muted-foreground">Total Wallets</p>
                <p className="text-2xl font-bold">{formatNumber(data?.totalUniqueWallets)}</p>
                <p className="text-xs text-muted-foreground">unique signers</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Bot Activity</p>
                <p className="text-2xl font-bold text-red-600">{comp?.botPercent.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{comp?.bots} bots detected</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">Smart Money</p>
                <p className="text-2xl font-bold text-blue-600">{comp?.smartMoney ?? 0}</p>
                <p className="text-xs text-muted-foreground">sophisticated wallets</p>
              </CardContent>
            </Card>
            <Card className="border-purple-200">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">VIP Users</p>
                <p className="text-2xl font-bold text-purple-600">{data?.vipWallets.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">100+ transactions</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Composition Chart + Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">User Composition</CardTitle>
            <CardDescription className="text-xs">Wallet type distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
                No wallet data yet. Click &quot;Classify Wallets&quot; to analyze.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [v, 'wallets']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Label breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Label Breakdown</CardTitle>
            <CardDescription className="text-xs">What each label means</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(LABEL_CONFIG).map(([label, cfg]) => {
                const count = comp ? (
                  label === 'bot' ? comp.bots
                  : label === 'whale' ? comp.whales
                  : label === 'smart_money' ? comp.smartMoney
                  : label === 'retail' ? comp.retail
                  : label === 'fresh' ? comp.fresh
                  : comp.dormant
                ) : 0;
                const total = data?.totalUniqueWallets || 1;
                const pct = (count / total) * 100;

                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs font-medium w-24 ${cfg.color}`}>
                      {cfg.icon}
                      {label.replace('_', ' ')}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg.bg.replace('bg-', 'bg-').replace('-100', '-400')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VIP Wallets */}
      {(data?.vipWallets.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Star className="h-4 w-4 text-purple-500" />
              VIP Users (100+ Transactions)
            </CardTitle>
            <CardDescription className="text-xs">
              Power users who interact with your program most frequently
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Wallet</TableHead>
                    <TableHead className="text-xs text-right">Transactions</TableHead>
                    <TableHead className="text-xs text-right">Success Rate</TableHead>
                    <TableHead className="text-xs">Explorer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.vipWallets.map((w, i) => (
                    <TableRow key={w.address}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{formatAddress(w.address, 8)}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{formatNumber(w.txCount)}</TableCell>
                      <TableCell className="text-right text-xs">
                        <span className={w.successRate >= 0.95 ? 'text-green-600' : w.successRate >= 0.80 ? 'text-yellow-600' : 'text-red-600'}>
                          {(w.successRate * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://solscan.io/account/${w.address}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Wallets with Classification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Top Wallets by Activity</CardTitle>
          <CardDescription className="text-xs">
            Most active wallets with AI-powered classification
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (data?.topWallets.length ?? 0) === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
              <Users className="h-4 w-4" />
              No wallet data yet. Click &quot;Classify Wallets&quot; to analyze.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Wallet</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">Tx Count</TableHead>
                    <TableHead className="text-xs text-right">Success Rate</TableHead>
                    <TableHead className="text-xs text-right">Tx/Day</TableHead>
                    <TableHead className="text-xs">Reasoning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.topWallets.slice(0, 15).map(w => (
                    <TableRow key={w.address}>
                      <TableCell className="font-mono text-xs">
                        <a
                          href={`https://solscan.io/account/${w.address}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-1"
                        >
                          {formatAddress(w.address, 6)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell><LabelBadge label={w.primaryLabel} /></TableCell>
                      <TableCell className="text-right text-xs">{formatNumber(w.stats.totalTxCount)}</TableCell>
                      <TableCell className="text-right text-xs">
                        <span className={w.stats.successRate >= 0.95 ? 'text-green-600' : w.stats.successRate >= 0.80 ? 'text-yellow-600' : 'text-red-600'}>
                          {(w.stats.successRate * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs">{w.stats.avgTxPerDay.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {w.reasoning}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot warning */}
      {(comp?.botPercent ?? 0) > 30 && (
        <Card className="border-red-200 bg-red-50/40 dark:bg-red-950/20">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 dark:text-red-400">
                <span className="font-medium">High bot activity detected: </span>
                {comp?.botPercent.toFixed(1)}% of wallets show bot-like behavior.
                This may indicate your program&apos;s incentives are being gamed. Consider rate limiting or anti-bot measures.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default WalletIntelligenceTab;

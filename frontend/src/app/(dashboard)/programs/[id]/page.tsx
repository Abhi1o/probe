'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { socketClient } from '@/lib/websocket/socket';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import {
  Activity, TrendingUp, AlertCircle, ExternalLink, Copy,
  CheckCircle, XCircle, ArrowLeft, Bell, BellOff, Plus,
  Trash2, Save, Wifi, WifiOff, RefreshCw, Zap, Clock,
  Settings, Users, DollarSign, TrendingDown, BarChart2,
  Shield, AlertTriangle, Info, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatAddress, formatRelativeTime, formatNumber, copyToClipboard } from '@/lib/utils';

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  primary: '#6366f1',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  muted: '#94a3b8',
  blue: '#3b82f6',
  purple: '#a855f7',
  teal: '#14b8a6',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const feeToSol = (fee: string | number | null | undefined) => {
  if (fee == null) return '0.000000';
  const num = Number(fee);
  return isNaN(num) ? '0.000000' : (num / 1e9).toFixed(6);
};

const lamportsToSol = (l: number | null | undefined) => {
  if (l == null) return '0.0000';
  return isNaN(l) ? '0.0000' : (l / 1e9).toFixed(4);
};

const explorerNet = (n: string) => n.toLowerCase().replace('_', '-');

const pct = (v: number | null | undefined) => {
  if (v == null) return '0.0%';
  const num = Number(v);
  return isNaN(num) ? '0.0%' : `${num.toFixed(1)}%`;
};

const fmt = (n: number | null | undefined) => {
  if (n == null || isNaN(n)) return '0';
  return formatNumber(Math.round(n));
};

function DeltaBadge({ value }: { value: string | number | null | undefined }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const v = Number(value);
  if (isNaN(v) || v === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={`text-xs flex items-center gap-0.5 ${v > 0 ? 'text-green-600' : 'text-red-500'}`}>
      {v > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const { data: program, isLoading } = useQuery<any>({
    queryKey: ['programs', params.id],
    queryFn: async () => (await apiClient.get(`/programs/${params.id}`)).data,
    enabled: !!params.id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['programs', params.id, 'stats'],
    queryFn: async () => (await apiClient.get(`/programs/${params.id}/stats`)).data,
    enabled: !!params.id,
    refetchInterval: 30000,
  });

  const { data: summary } = useQuery<any>({
    queryKey: ['analytics', params.id, 'summary'],
    queryFn: async () => (await apiClient.get(`/analytics/program/${params.id}/summary`)).data,
    enabled: !!params.id,
    refetchInterval: 60000,
  });

  const handleCopy = async () => {
    if (program?.programId) { await copyToClipboard(program.programId); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (isLoading) return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      <Skeleton className="h-96 w-full" />
    </div>
  );

  if (!program) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Program not found</h2>
      <Link href="/programs"><Button><ArrowLeft className="mr-2 h-4 w-4" />Back to Programs</Button></Link>
    </div>
  );

  const cluster = explorerNet(program.network);
  const totalAll = stats?.totalTransactions ?? 0;
  const successAll = stats?.successfulTransactions ?? 0;
  const failedAll = stats?.failedTransactions ?? 0;
  const successRate = Number(stats?.successRate ?? 0);
  const avgCu = Number(stats?.avgComputeUnits ?? 0);
  const last24h = summary?.last24h?.txCount ?? stats?.last24Hours ?? 0;
  const change24h = summary?.last24h?.change ?? '0';
  const uniqueSigners = summary?.allTime?.uniqueSigners ?? 0;
  const totalFees = summary?.allTime?.totalFees ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <Link href="/programs">
          <Button variant="ghost" size="sm" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Programs</Button>
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
              <Badge variant={program.isActive ? 'success' : 'secondary'}>{program.isActive ? 'Active' : 'Inactive'}</Badge>
              <Badge variant="outline" className="font-mono text-xs">{program.network}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">{program.programId}</code>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 w-7 p-0">
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <a href={`https://explorer.solana.com/address/${program.programId}?cluster=${cluster}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground text-sm transition-colors">
                <ExternalLink className="h-4 w-4" />Solana Explorer
              </a>
              <a href={`https://solscan.io/account/${program.programId}${cluster !== 'mainnet-beta' ? `?cluster=${cluster}` : ''}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground text-sm transition-colors">
                <ExternalLink className="h-4 w-4" />Solscan
              </a>
            </div>
            {program.description && <p className="mt-2 text-muted-foreground max-w-2xl">{program.description}</p>}
          </div>
        </div>
      </div>

      {/* ── 6 Stats Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Transactions" icon={<Activity className="h-4 w-4" />} loading={statsLoading}
          value={fmt(totalAll)} sub={`${fmt(successAll)} success · ${fmt(failedAll)} failed`} color="blue" />
        <StatCard title="Success Rate" icon={<Shield className="h-4 w-4" />} loading={statsLoading}
          value={pct(successRate)} sub="All time" color={successRate >= 95 ? 'success' : successRate >= 80 ? 'warning' : 'danger'} />
        <StatCard title="Avg Compute Units" icon={<Zap className="h-4 w-4" />} loading={statsLoading}
          value={fmt(avgCu)} sub={`${(avgCu / 1400000 * 100).toFixed(1)}% of max budget`} color="purple" />
        <StatCard title="Last 24h" icon={<Clock className="h-4 w-4" />} loading={statsLoading}
          value={fmt(last24h)} sub={<DeltaBadge value={change24h} />} color="teal" />
        <StatCard title="Unique Signers" icon={<Users className="h-4 w-4" />} loading={statsLoading}
          value={fmt(uniqueSigners)} sub="All time callers" color="primary" />
        <StatCard title="Total Fees Paid" icon={<DollarSign className="h-4 w-4" />} loading={statsLoading}
          value={`${lamportsToSol(totalFees)} SOL`} sub={`${(totalFees / 1e9).toFixed(4)} SOL`} color="warning" />
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compute">Compute Units</TabsTrigger>
          <TabsTrigger value="fees">Fee Analysis</TabsTrigger>
          <TabsTrigger value="signers">Top Signers</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <TransactionsTab programDbId={params.id} programId={program.programId} network={program.network} cluster={cluster} accessToken={accessToken} isAuthenticated={isAuthenticated} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab programDbId={params.id} />
        </TabsContent>
        <TabsContent value="compute">
          <ComputeTab programDbId={params.id} />
        </TabsContent>
        <TabsContent value="fees">
          <FeesTab programDbId={params.id} />
        </TabsContent>
        <TabsContent value="signers">
          <SignersTab programDbId={params.id} cluster={cluster} />
        </TabsContent>
        <TabsContent value="errors">
          <ErrorsTab programDbId={params.id} />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertsTab programDbId={params.id} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab program={program} onDeleted={() => router.push('/programs')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const colorMap: Record<string, string> = {
  blue: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  success: 'text-green-500 bg-green-50 dark:bg-green-950',
  danger: 'text-red-500 bg-red-50 dark:bg-red-950',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
  purple: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  teal: 'text-teal-500 bg-teal-50 dark:bg-teal-950',
  primary: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950',
};

function StatCard({ title, icon, loading, value, sub, color = 'blue' }: any) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
          <span className={`p-1.5 rounded-md ${colorMap[color] ?? colorMap.blue}`}>{icon}</span>
        </div>
        {loading ? <><Skeleton className="h-7 w-20 mb-1" /><Skeleton className="h-3 w-28" /></> : (
          <>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Period Selector ──────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange, options = ['24h', '7d', '30d'] }: { value: string; onChange: (v: string) => void; options?: string[] }) {
  return (
    <div className="flex gap-1">
      {options.map(p => (
        <Button key={p} variant={value === p ? 'default' : 'outline'} size="sm" onClick={() => onChange(p)} className="h-7 px-2 text-xs">{p}</Button>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon = Activity, title, desc }: { icon?: any; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {desc && <p className="text-sm text-muted-foreground max-w-xs">{desc}</p>}
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function TransactionsTab({ programDbId, programId, network, cluster, accessToken, isAuthenticated }: any) {
  const [txs, setTxs] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [wsLive, setWsLive] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const LIMIT = 50;

  const { data, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ['transactions', programDbId, offset, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiClient.get(`/transactions/program/${programDbId}?${params}`);
      // Embed the offset so the effect knows which page this data belongs to
      return { ...res.data, _offset: offset };
    },
    enabled: !!programDbId,
    staleTime: 0,
    gcTime: 0, // Don't cache old data (was cacheTime in older versions)
    refetchOnMount: 'always', // Always fetch fresh data on mount
  });

  useEffect(() => {
    if (!data) return;
    setTotal(data.total ?? 0);
    const incoming = data.data ?? [];
    if ((data._offset ?? 0) === 0) {
      setTxs(incoming);
    } else {
      setTxs(prev => {
        const sigs = new Set(prev.map((t: any) => t.signature));
        return [...prev, ...incoming.filter((t: any) => !sigs.has(t.signature))];
      });
    }
  }, [data]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !programId) return;
    try {
      const socket = socketClient.connect(accessToken);
      socket.on('connect', () => { setWsLive(true); socketClient.subscribeToProgram(programId, network); });
      socket.on('disconnect', () => setWsLive(false));
      socketClient.onTransaction((tx: any) => {
        setTxs(prev => {
          if (prev.some((t: any) => t.signature === tx.signature)) return prev;
          return [tx, ...prev].slice(0, 300);
        });
      });
    } catch {}
    return () => { try { socketClient.off('transaction:new'); socketClient.unsubscribeFromProgram(programId); } catch {} };
  }, [isAuthenticated, accessToken, programId, network]);

  const resetAndRefetch = (status: string) => { 
    setStatusFilter(status === 'all' ? '' : status); 
    setOffset(0); 
    // Don't clear txs here - let the new data replace it
  };

  const handleRefresh = () => {
    setOffset(0);
    // Don't clear txs - just refetch and let new data replace it
    refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <div>
          <CardTitle>Transactions</CardTitle>
          <CardDescription className="flex items-center gap-2 mt-1">
            {wsLive ? (
              <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span><span className="text-green-600 font-medium text-xs">Live</span></>
            ) : <><WifiOff className="h-3 w-3" /><span className="text-xs">REST</span></>}
            <span className="text-muted-foreground text-xs">· {total.toLocaleString()} total</span>
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter || 'all'} onValueChange={resetAndRefetch}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="All status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && txs.length === 0 ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : txs.length === 0 ? (
          <EmptyState title="No transactions yet" desc="Transactions will appear here as they occur on-chain." />
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Fee (SOL)</TableHead>
                    <TableHead>Compute Units</TableHead>
                    <TableHead>Signer</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs.map((tx: any) => (
                    <TableRow key={tx.signature}>
                      <TableCell className="font-mono text-xs">
                        <a href={`https://explorer.solana.com/tx/${tx.signature}?cluster=${cluster}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 flex items-center gap-1">
                          {formatAddress(tx.signature, 6)}<ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {tx.status === 'SUCCESS'
                          ? <Badge variant="success" className="flex items-center gap-1 w-fit text-xs"><CheckCircle className="h-3 w-3" />Success</Badge>
                          : <Badge variant="destructive" className="flex items-center gap-1 w-fit text-xs"><XCircle className="h-3 w-3" />Failed</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tx.slot ? Number(tx.slot).toLocaleString() : '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.fee ? feeToSol(tx.fee) : '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.computeUnits != null ? formatNumber(tx.computeUnits) : '—'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{tx.signer ? formatAddress(tx.signer, 4) : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{tx.blockTime ? formatRelativeTime(tx.blockTime) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {txs.length < total && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={() => setOffset(p => p + LIMIT)} disabled={isFetching}>
                  {isFetching && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  Load More ({txs.length} / {total})
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ programDbId }: { programDbId: string }) {
  const [period, setPeriod] = useState<string>('24h');

  const { data: metrics, isLoading: mLoad } = useQuery<any[]>({
    queryKey: ['analytics', programDbId, 'metrics', period],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/metrics?period=${period}`)).data ?? [],
    enabled: !!programDbId,
  });
  const { data: hourly, isLoading: hLoad } = useQuery<any[]>({
    queryKey: ['analytics', programDbId, 'hourly'],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/hourly`)).data ?? [],
    enabled: !!programDbId,
  });
  const { data: dist } = useQuery<any>({
    queryKey: ['analytics', programDbId, 'dist'],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/distribution`)).data,
    enabled: !!programDbId,
  });
  const { data: trends } = useQuery<any[]>({
    queryKey: ['analytics', programDbId, 'trends'],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/trends?period=7d`)).data ?? [],
    enabled: !!programDbId,
  });
  const { data: users } = useQuery<any[]>({
    queryKey: ['analytics', programDbId, 'users'],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/unique-users?period=7d`)).data ?? [],
    enabled: !!programDbId,
  });

  const areaData = (metrics ?? []).map((m: any) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    transactions: m.count ?? 0,
    successRate: Number((m.successRate ?? 0).toFixed(1)),
  }));

  const barData = (hourly ?? []).map((h: any) => ({
    hour: h.timestamp ?? `${h.hour}:00`,
    success: h.successCount ?? 0,
    failed: h.failureCount ?? 0,
  }));

  const pieData = dist ? [
    { name: 'Success', value: dist.success ?? 0 },
    { name: 'Failed', value: dist.failed ?? 0 },
  ] : [];
  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  const trendData = (trends ?? []).map((t: any) => ({
    date: new Date(t.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    transactions: t.count ?? 0,
    successRate: Number((t.successRate ?? 0).toFixed(1)),
  }));

  const userData = (users ?? []).map((u: any) => ({
    date: new Date(u.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    uniqueUsers: u.uniqueUsers ?? 0,
    txCount: u.txCount ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transaction Analytics</h2>
        <PeriodSelector value={period} onChange={setPeriod} options={['1h', '24h', '7d', '30d']} />
      </div>

      {/* Volume + Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transaction Volume & Success Rate</CardTitle>
          <CardDescription>Hourly breakdown for selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {mLoad ? <Skeleton className="h-56 w-full" /> : areaData.length === 0 ? <EmptyState title="No data for this period" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="transactions" name="Transactions" stroke={C.primary} strokeWidth={2} fill="url(#volGrad)" />
                <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success %" stroke={C.success} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hourly Activity (Today)</CardTitle>
            <CardDescription>Success vs failed per hour</CardDescription>
          </CardHeader>
          <CardContent>
            {hLoad ? <Skeleton className="h-48 w-full" /> : barData.length === 0 ? <EmptyState title="No hourly data" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="success" name="Success" stackId="a" fill={C.success} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" stackId="a" fill={C.danger} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outcome Distribution</CardTitle>
            <CardDescription>Success vs failed ratio</CardDescription>
          </CardHeader>
          <CardContent>
            {totalPie === 0 ? <EmptyState title="No distribution data" /> : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? C.success : C.danger} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} (${((v / totalPie) * 100).toFixed(1)}%)`]} />
                    <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-day trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">7-Day Trend</CardTitle>
          <CardDescription>Daily transaction volume and success rate</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? <EmptyState title="No trend data yet" desc="Needs at least 2 days of data" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.teal} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="transactions" name="Transactions" stroke={C.teal} strokeWidth={2} fill="url(#trendGrad)" />
                <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success %" stroke={C.success} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Unique users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Unique Signers Over Time</CardTitle>
          <CardDescription>Daily unique wallet addresses calling this program</CardDescription>
        </CardHeader>
        <CardContent>
          {userData.length === 0 ? <EmptyState icon={Users} title="No user data yet" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={userData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="uniqueUsers" name="Unique Signers" fill={C.purple} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Compute Tab ──────────────────────────────────────────────────────────────
function ComputeTab({ programDbId }: { programDbId: string }) {
  const [period, setPeriod] = useState<string>('7d');

  const { data: cu, isLoading } = useQuery<any>({
    queryKey: ['analytics', programDbId, 'compute', period],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/compute-efficiency?period=${period}`)).data,
    enabled: !!programDbId,
  });
  const { data: metrics } = useQuery<any[]>({
    queryKey: ['analytics', programDbId, 'metrics', period],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/metrics?period=${period}`)).data ?? [],
    enabled: !!programDbId,
  });

  const cuTrend = (metrics ?? []).map((m: any) => ({
    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avgCu: Math.round(m.avgComputeUnits ?? 0),
  }));

  const MAX_CU = 1_400_000;
  const utilPct = cu ? Math.min((cu.avgCu / MAX_CU) * 100, 100) : 0;
  const utilColor = utilPct < 30 ? C.success : utilPct < 70 ? C.warning : C.danger;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Compute Unit Analysis</h2>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* CU stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Avg CU', value: cu ? fmt(cu.avgCu) : '—', sub: 'Mean per transaction' },
          { label: 'Median CU', value: cu ? fmt(cu.medianCu) : '—', sub: '50th percentile' },
          { label: 'P95 CU', value: cu ? fmt(cu.p95Cu) : '—', sub: '95th percentile' },
          { label: 'Max CU', value: cu ? fmt(cu.maxCu) : '—', sub: 'Highest observed' },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              {isLoading ? <Skeleton className="h-7 w-20" /> : <><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{sub}</p></>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Utilization bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Budget Utilization</CardTitle>
          <CardDescription>Average CU used vs 1.4M max per transaction</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-8 w-full" /> : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{cu ? fmt(cu.avgCu) : 0} CU avg</span>
                <span className="text-muted-foreground">{utilPct.toFixed(1)}% of 1.4M budget</span>
              </div>
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${utilPct}%`, backgroundColor: utilColor }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span><span>700k (50%)</span><span>1.4M (max)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribution buckets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CU Distribution</CardTitle>
            <CardDescription>Transaction count by compute range</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : !cu?.distribution?.length ? <EmptyState title="No distribution data" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cu.distribution} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name="Transactions" fill={C.purple} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* CU over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg CU Over Time</CardTitle>
            <CardDescription>Compute efficiency trend</CardDescription>
          </CardHeader>
          <CardContent>
            {cuTrend.length === 0 ? <EmptyState title="No trend data" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={cuTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.purple} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={200000} stroke={C.warning} strokeDasharray="4 4" label={{ value: '200k', fontSize: 10 }} />
                  <Area type="monotone" dataKey="avgCu" name="Avg CU" stroke={C.purple} strokeWidth={2} fill="url(#cuGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Efficiency insight */}
      {cu && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Compute Efficiency Insight</p>
                <p className="text-blue-600 dark:text-blue-400">
                  This program uses an average of <strong>{fmt(cu.avgCu)} CU</strong> per transaction
                  ({utilPct.toFixed(1)}% of the 1.4M budget).
                  {utilPct < 20 && ' Very efficient — well within limits.'}
                  {utilPct >= 20 && utilPct < 50 && ' Moderate usage — room for optimization.'}
                  {utilPct >= 50 && utilPct < 80 && ' High usage — consider optimizing hot paths.'}
                  {utilPct >= 80 && ' Critical — approaching compute limits. Optimization recommended.'}
                  {' '}P95 is <strong>{fmt(cu.p95Cu)} CU</strong>, meaning 95% of transactions stay below this.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Fees Tab ─────────────────────────────────────────────────────────────────
function FeesTab({ programDbId }: { programDbId: string }) {
  const [period, setPeriod] = useState<string>('7d');

  const { data: fee, isLoading } = useQuery<any>({
    queryKey: ['analytics', programDbId, 'fees', period],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/fee-analysis?period=${period}`)).data,
    enabled: !!programDbId,
  });

  const feeCards = fee ? [
    { label: 'Min Fee', value: `${(fee.minFee / 1e9).toFixed(6)} SOL`, sub: `${fee.minFee.toLocaleString()} lamports` },
    { label: 'Avg Fee', value: `${(fee.avgFee / 1e9).toFixed(6)} SOL`, sub: 'Mean per transaction' },
    { label: 'Median Fee', value: `${(fee.medianFee / 1e9).toFixed(6)} SOL`, sub: '50th percentile' },
    { label: 'P95 Fee', value: `${(fee.p95Fee / 1e9).toFixed(6)} SOL`, sub: '95th percentile' },
    { label: 'Max Fee', value: `${(fee.maxFee / 1e9).toFixed(6)} SOL`, sub: 'Highest observed' },
    { label: 'Total Fees', value: `${(fee.totalFees / 1e9).toFixed(4)} SOL`, sub: `${fee.txCount.toLocaleString()} transactions` },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fee Analysis</h2>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />) :
          feeCards.map(({ label, value, sub }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <p className="text-lg font-bold font-mono">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Fee distribution chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fee Distribution (Lamports)</CardTitle>
          <CardDescription>Transaction count by fee range</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-56 w-full" /> : !fee?.distribution?.length ? <EmptyState title="No fee data" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fee.distribution} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="Transactions" fill={C.warning} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {fee && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">Fee Summary</p>
                <p className="text-amber-600 dark:text-amber-400">
                  Over {fee.txCount.toLocaleString()} transactions, this program collected a total of{' '}
                  <strong>{(fee.totalFees / 1e9).toFixed(4)} SOL</strong> in fees.
                  The average fee is <strong>{(fee.avgFee / 1e9).toFixed(6)} SOL</strong> ({fee.avgFee.toLocaleString()} lamports).
                  Base fee on Solana is 5,000 lamports per signature — priority fees account for the rest.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Signers Tab ──────────────────────────────────────────────────────────────
function SignersTab({ programDbId, cluster }: { programDbId: string; cluster: string }) {
  const [period, setPeriod] = useState<string>('7d');

  const { data: signers, isLoading } = useQuery<any[]>({
    queryKey: ['analytics', programDbId, 'signers', period],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/top-signers?period=${period}&limit=20`)).data ?? [],
    enabled: !!programDbId,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Top Signers</h2>
          <p className="text-sm text-muted-foreground">Wallets that called this program most frequently</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !signers?.length ? (
            <EmptyState icon={Users} title="No signer data yet" desc="Signers will appear once transactions are indexed." />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                    <TableHead className="text-right">Total Fees (SOL)</TableHead>
                    <TableHead className="text-right">Avg CU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signers.map((s: any, i: number) => (
                    <TableRow key={s.signer}>
                      <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <a
                          href={`https://explorer.solana.com/address/${s.signer}?cluster=${cluster}`}
                          target="_blank" rel="noopener noreferrer"
                          className="hover:text-blue-500 flex items-center gap-1"
                        >
                          {formatAddress(s.signer, 8)}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{s.txCount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-medium ${Number(s.successRate) >= 95 ? 'text-green-600' : Number(s.successRate) >= 80 ? 'text-amber-600' : 'text-red-500'}`}>
                          {s.successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{(s.totalFees / 1e9).toFixed(6)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmt(s.avgCompute)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Errors Tab ───────────────────────────────────────────────────────────────
function ErrorsTab({ programDbId }: { programDbId: string }) {
  const [period, setPeriod] = useState<string>('7d');

  const { data: errors, isLoading } = useQuery<any[]>({
    queryKey: ['analytics', programDbId, 'errors', period],
    queryFn: async () => (await apiClient.get(`/analytics/program/${programDbId}/error-breakdown?period=${period}`)).data ?? [],
    enabled: !!programDbId,
  });

  const totalErrors = (errors ?? []).reduce((s: number, e: any) => s + e.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Error Analysis</h2>
          <p className="text-sm text-muted-foreground">Failed transaction breakdown by error type</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {isLoading ? <Skeleton className="h-64 w-full" /> : !errors?.length ? (
        <Card>
          <CardContent className="pt-4">
            <EmptyState icon={CheckCircle} title="No errors in this period" desc="All transactions succeeded — great job!" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Error Frequency</CardTitle>
              <CardDescription>{totalErrors.toLocaleString()} total failed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={errors} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis type="category" dataKey="errorType" tick={{ fontSize: 9 }} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" name="Count" fill={C.danger} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Error Breakdown Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {errors.map((e: any) => (
                  <div key={e.errorType} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm truncate font-mono">{e.errorType}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-medium">{e.count.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {((e.count / totalErrors) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────
const DEFAULT_FORM = { name: '', condition: 'TRANSACTION_COUNT_THRESHOLD', threshold: '', comparison: 'GREATER_THAN', channels: ['EMAIL'] };

function AlertsTab({ programDbId }: { programDbId: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ ...DEFAULT_FORM });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: alerts, isLoading } = useQuery<any[]>({
    queryKey: ['alerts', programDbId],
    queryFn: async () => (await apiClient.get(`/alerts/program/${programDbId}`)).data ?? [],
    enabled: !!programDbId,
  });

  const createMut = useMutation({
    mutationFn: async (d: any) => (await apiClient.post('/alerts', d)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts', programDbId] }); setShowForm(false); setForm({ ...DEFAULT_FORM }); },
  });
  const deleteMut = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/alerts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts', programDbId] }); setConfirmDeleteId(null); },
  });
  const toggleMut = useMutation({
    mutationFn: async ({ id, enabled }: any) => (await apiClient.patch(`/alerts/${id}`, { enabled })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', programDbId] }),
  });

  const toggleChannel = (ch: string) => setForm((p: any) => ({
    ...p, channels: p.channels.includes(ch) ? p.channels.filter((c: string) => c !== ch) : [...p.channels, ch],
  }));

  const conditionLabel = (c: string) => ({ TRANSACTION_COUNT_THRESHOLD: 'Tx Count', TRANSACTION_FAILURE_RATE: 'Failure Rate', COMPUTE_UNITS_EXCEEDED: 'Compute Units' }[c] ?? c);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Alerts</h2>
          <p className="text-sm text-muted-foreground">Get notified when thresholds are breached</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}><Plus className="h-4 w-4 mr-2" />Create Alert</Button>
      </div>

      {showForm && (
        <Card className="border-primary/40">
          <CardHeader><CardTitle className="text-base">New Alert</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.threshold) return; createMut.mutate({ name: form.name, programId: programDbId, condition: form.condition, threshold: Number(form.threshold), comparison: form.comparison, channels: form.channels }); }} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Alert Name</Label>
                  <Input placeholder="e.g. High failure rate" value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label>Condition</Label>
                  <Select value={form.condition} onValueChange={v => setForm((p: any) => ({ ...p, condition: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSACTION_COUNT_THRESHOLD">Transaction Count</SelectItem>
                      <SelectItem value="TRANSACTION_FAILURE_RATE">Failure Rate (%)</SelectItem>
                      <SelectItem value="COMPUTE_UNITS_EXCEEDED">Compute Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Comparison</Label>
                  <Select value={form.comparison} onValueChange={v => setForm((p: any) => ({ ...p, comparison: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GREATER_THAN">Greater than (&gt;)</SelectItem>
                      <SelectItem value="LESS_THAN">Less than (&lt;)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Threshold</Label>
                  <Input type="number" placeholder="e.g. 100" value={form.threshold} onChange={e => setForm((p: any) => ({ ...p, threshold: e.target.value }))} required min={0} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notification Channels</Label>
                <div className="flex gap-4">
                  {['EMAIL', 'SLACK', 'DISCORD'].map(ch => (
                    <label key={ch} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.channels.includes(ch)} onChange={() => toggleChannel(ch)} className="rounded" />
                      {ch}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm({ ...DEFAULT_FORM }); }}>Cancel</Button>
                <Button type="submit" disabled={createMut.isPending}>
                  {createMut.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  <Bell className="h-4 w-4 mr-2" />Create Alert
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        : !alerts?.length ? (
          <Card><CardContent className="pt-4"><EmptyState icon={Bell} title="No alerts configured" desc="Create an alert to get notified when thresholds are breached." /></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((a: any) => (
              <Card key={a.id} className={a.enabled ? '' : 'opacity-60'}>
                <CardContent className="flex items-center justify-between py-4 gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-full ${a.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                      {a.enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {conditionLabel(a.condition)} {a.comparison === 'GREATER_THAN' ? '>' : '<'} <span className="font-mono font-medium">{a.threshold}</span>
                        {a._count?.triggers != null && <span className="ml-2 text-xs">· {a._count.triggers} trigger{a._count.triggers !== 1 ? 's' : ''}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex gap-1">{(a.channels ?? []).map((ch: string) => <Badge key={ch} variant="outline" className="text-xs">{ch}</Badge>)}</div>
                    <button onClick={() => toggleMut.mutate({ id: a.id, enabled: !a.enabled })} disabled={toggleMut.isPending}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${a.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${a.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                    {confirmDeleteId === a.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate(a.id)} disabled={deleteMut.isPending}>Confirm</Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(a.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ program, onDeleted }: { program: any; onDeleted: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(program.name);
  const [description, setDescription] = useState(program.description ?? '');
  const [isActive, setIsActive] = useState(program.isActive);
  const [copiedId, setCopiedId] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [saved, setSaved] = useState(false);

  const updateMut = useMutation({
    mutationFn: async (d: any) => (await apiClient.patch(`/programs/${program.id}`, d)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs', program.id] }); qc.invalidateQueries({ queryKey: ['programs'] }); setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });
  const deleteMut = useMutation({
    mutationFn: async () => apiClient.delete(`/programs/${program.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs'] }); onDeleted(); },
  });

  const handleCopyId = async () => { await copyToClipboard(program.programId); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />General Settings</CardTitle>
          <CardDescription>Update program display name, description, and monitoring status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); updateMut.mutate({ name, description, isActive }); }} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Program Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Active Monitoring</p>
                <p className="text-xs text-muted-foreground mt-0.5">When disabled, new transactions will not be indexed.</p>
              </div>
              <button type="button" onClick={() => setIsActive((v: boolean) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="space-y-1.5">
              <Label>Network</Label>
              <div className="flex items-center gap-2">
                <Input value={program.network} readOnly className="bg-muted cursor-default" />
                <Badge variant="outline">{program.network}</Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Program ID</Label>
              <div className="flex items-center gap-2">
                <Input value={program.programId} readOnly className="bg-muted cursor-default font-mono text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={handleCopyId} className="flex-shrink-0">
                  {copiedId ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={updateMut.isPending}>
                {updateMut.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
              {saved && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle className="h-4 w-4" />Saved</span>}
              {updateMut.isError && <span className="text-sm text-destructive">Failed to save.</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div>
              <p className="font-medium text-sm">Delete Program</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently deletes all transactions, analytics, and alerts.</p>
            </div>
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Program</DialogTitle>
                  <DialogDescription>This will permanently delete <strong>{program.name}</strong> and all its data. This cannot be undone.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <Label>Type <strong>{program.name}</strong> to confirm</Label>
                  <Input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder={program.name} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowDelete(false); setDeleteInput(''); }}>Cancel</Button>
                  <Button variant="destructive" disabled={deleteInput !== program.name || deleteMut.isPending} onClick={() => deleteMut.mutate()}>
                    {deleteMut.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Delete Program
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Zap,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useInstructionUsage, useInstructionErrors } from '@/hooks/use-analytics';
import { formatNumber, formatAddress } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageData {
  totalCalls: number;
  successRate: number;
  errorRate: number;
  avgComputeUnits: number;
  p50ComputeUnits?: number;
  p95ComputeUnits?: number;
  p99ComputeUnits?: number;
  hourlyTrend?: HourlyPoint[];
  topCallers?: Caller[];
}

interface HourlyPoint {
  hour: string;
  calls: number;
  errors: number;
  successRate?: number;
}

interface Caller {
  address: string;
  calls: number;
  successRate?: number;
}

interface ErrorEntry {
  errorCode: string;
  errorName?: string;
  count: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
  isNew?: boolean;
}

interface ErrorsData {
  errors: ErrorEntry[];
}

interface Props {
  programId: string;
  instructionName: string;
  windowHours: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number | null | undefined) {
  if (v == null || isNaN(v)) return '0.0%';
  return `${Number(v).toFixed(1)}%`;
}

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />;
  if (trend === 'down') return <ArrowDownRight className="h-3.5 w-3.5 text-green-500" />;
  return <span className="h-3.5 w-3.5 inline-block text-muted-foreground">—</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color = 'text-foreground',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className={`text-lg font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-md text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InstructionDetail({ programId, instructionName, windowHours }: Props) {
  const { data: usage, isLoading: usageLoading } = useInstructionUsage(
    programId,
    instructionName,
    windowHours,
  );
  const { data: errorsData, isLoading: errorsLoading } = useInstructionErrors(
    programId,
    instructionName,
    windowHours,
  );

  const u = usage as UsageData | undefined;
  const e = errorsData as ErrorsData | undefined;

  const hourlyTrend: HourlyPoint[] = u?.hourlyTrend ?? [];
  const topCallers: Caller[] = u?.topCallers ?? [];
  const errors: ErrorEntry[] = e?.errors ?? [];

  return (
    <div className="mt-2 space-y-4 rounded-xl border bg-muted/30 p-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-primary">{instructionName}</span>
        <span className="text-xs text-muted-foreground">— detail view</span>
      </div>

      {/* ── KPI Row ── */}
      {usageLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Calls"
            value={formatNumber(u?.totalCalls)}
            icon={<Zap className="h-3.5 w-3.5" />}
          />
          <StatCard
            label="Success Rate"
            value={pct(u?.successRate)}
            icon={<CheckCircle className="h-3.5 w-3.5" />}
            color={
              (u?.successRate ?? 0) >= 95
                ? 'text-green-600'
                : (u?.successRate ?? 0) >= 80
                ? 'text-yellow-600'
                : 'text-red-600'
            }
          />
          <StatCard
            label="Avg CU"
            value={formatNumber(u?.avgComputeUnits)}
            icon={<Zap className="h-3.5 w-3.5" />}
          />
          <StatCard
            label="P95 CU"
            value={formatNumber(u?.p95ComputeUnits)}
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
        </div>
      )}

      {/* ── CU Percentiles ── */}
      {!usageLoading && u && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            P50 CU:{' '}
            <span className="font-medium text-foreground">
              {formatNumber(u.p50ComputeUnits)}
            </span>
          </span>
          <span>
            P95 CU:{' '}
            <span className="font-medium text-foreground">
              {formatNumber(u.p95ComputeUnits)}
            </span>
          </span>
          <span>
            P99 CU:{' '}
            <span className="font-medium text-foreground">
              {formatNumber(u.p99ComputeUnits)}
            </span>
          </span>
        </div>
      )}

      {/* ── Two-column layout: chart + errors ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Hourly Trend Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hourly Trend</CardTitle>
            <CardDescription className="text-xs">Calls &amp; errors over time</CardDescription>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : hourlyTrend.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={hourlyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    name="Calls"
                    stroke="#6366f1"
                    fill="url(#gradCalls)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    name="Errors"
                    stroke="#ef4444"
                    fill="url(#gradErrors)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Error Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Error Breakdown</CardTitle>
            <CardDescription className="text-xs">
              {errors.length} error type{errors.length !== 1 ? 's' : ''} in window
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : errors.length === 0 ? (
              <div className="flex h-32 items-center justify-center gap-2 text-xs text-green-600">
                <CheckCircle className="h-4 w-4" />
                No errors in this window
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Code</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs text-right">Count</TableHead>
                    <TableHead className="text-xs text-right">%</TableHead>
                    <TableHead className="text-xs text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((err) => (
                    <TableRow key={err.errorCode}>
                      <TableCell className="font-mono text-xs">{err.errorCode}</TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1">
                          {err.errorName ?? '—'}
                          {err.isNew && (
                            <Badge
                              variant="destructive"
                              className="h-4 px-1 text-[10px]"
                            >
                              NEW
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {formatNumber(err.count)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {pct(err.percentage)}
                      </TableCell>
                      <TableCell className="text-right">
                        <TrendIcon trend={err.trend} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Callers ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Top Callers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : topCallers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No caller data available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">#</TableHead>
                  <TableHead className="text-xs">Address</TableHead>
                  <TableHead className="text-xs text-right">Calls</TableHead>
                  <TableHead className="text-xs text-right">Success Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCallers.map((caller, idx) => (
                  <TableRow key={caller.address}>
                    <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{formatAddress(caller.address, 6)}</TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {formatNumber(caller.calls)}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      <span
                        className={
                          (caller.successRate ?? 0) >= 95
                            ? 'text-green-600'
                            : (caller.successRate ?? 0) >= 80
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {pct(caller.successRate)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InstructionDetail;

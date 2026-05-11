'use client';

import { useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  useInstructionOverview,
  useInstructionUsage,
  useInstructionErrors,
  useInstructionLog,
  useNewErrors,
} from '@/hooks/use-analytics';
import { formatNumber, formatAddress, formatRelativeTime } from '@/lib/utils';
import { InstructionDetail } from './InstructionDetail';

// ─── Types ────────────────────────────────────────────────────────────────────

type WindowOption = { label: string; hours: number };

const WINDOWS: WindowOption[] = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

type StatusType = 'healthy' | 'degraded' | 'critical' | 'no_data';

interface InstructionRow {
  name: string;
  calls: number;
  sharePercent: number;
  successRate: number;
  errorRate: number;
  avgComputeUnits: number;
  topError?: string;
  status: StatusType;
}

interface OverviewData {
  totalCalls: number;
  successRate: number;
  errorRate: number;
  avgComputeUnits: number;
  instructions: InstructionRow[];
}

interface LogEntry {
  id: string;
  signature: string;
  instruction: string;
  success: boolean;
  errorCode?: string;
  computeUnits?: number;
  caller?: string;
  timestamp: string;
}

interface NewErrorsData {
  count: number;
  errors: Array<{ errorCode: string; errorName?: string; firstSeen: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(v: number | null | undefined) {
  if (v == null || isNaN(Number(v))) return '0.0%';
  return `${Number(v).toFixed(1)}%`;
}

function statusColor(status: StatusType): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

function statusLabel(status: StatusType): string {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'degraded':
      return 'Degraded';
    case 'critical':
      return 'Critical';
    default:
      return 'No Data';
  }
}

function deriveStatus(successRate: number, calls: number): StatusType {
  if (calls === 0) return 'no_data';
  if (successRate >= 95) return 'healthy';
  if (successRate >= 80) return 'degraded';
  return 'critical';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  loading,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
  color?: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {icon}
              {label}
            </div>
            <span className={`text-2xl font-bold ${color ?? 'text-foreground'}`}>{value}</span>
            {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusDot({ status }: { status: StatusType }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${statusColor(status)}`}
        title={statusLabel(status)}
      />
      <span className="text-xs text-muted-foreground">{statusLabel(status)}</span>
    </span>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const explorerUrl = `https://explorer.solana.com/tx/${entry.signature}?cluster=devnet`;
  return (
    <TableRow className="text-xs">
      <TableCell className="font-mono">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          {formatAddress(entry.signature, 6)}
          <ExternalLink className="h-3 w-3" />
        </a>
      </TableCell>
      <TableCell className="font-mono">{entry.instruction}</TableCell>
      <TableCell>
        {entry.success ? (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3.5 w-3.5" />
            OK
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="h-3.5 w-3.5" />
            {entry.errorCode ?? 'Error'}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">{formatNumber(entry.computeUnits)}</TableCell>
      <TableCell className="font-mono text-muted-foreground">
        {entry.caller ? formatAddress(entry.caller, 4) : '—'}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatRelativeTime(entry.timestamp)}
      </TableCell>
    </TableRow>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 py-16 text-center">
      <Activity className="h-10 w-10 text-muted-foreground/50" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No instruction data yet</p>
        <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
          The indexer will populate this as transactions are processed. If you&apos;ve uploaded an
          Anchor IDL, instruction names will be decoded automatically.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface MethodsTabProps {
  programDbId: string;
}

export function MethodsTab({ programDbId }: MethodsTabProps) {
  const [windowHours, setWindowHours] = useState(24);
  const [selectedInstruction, setSelectedInstruction] = useState<string | null>(null);

  // ── Data hooks ──
  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
    isRefetching,
  } = useInstructionOverview(programDbId, windowHours);

  const { data: logData, isLoading: logLoading } = useInstructionLog(programDbId, {
    limit: 20,
  });

  const { data: newErrorsData } = useNewErrors(programDbId, windowHours);

  const ov = overview as OverviewData | undefined;
  const instructions: InstructionRow[] = (ov?.instructions ?? []).map((row) => ({
    ...row,
    status: row.status ?? deriveStatus(row.successRate, row.calls),
  }));

  const logEntries: LogEntry[] = (logData as any)?.entries ?? (logData as any)?.data ?? [];
  const newErrors = newErrorsData as NewErrorsData | undefined;
  const newErrorCount = newErrors?.count ?? 0;

  // ── Row click handler ──
  const handleRowClick = useCallback(
    (name: string) => {
      setSelectedInstruction((prev) => (prev === name ? null : name));
    },
    [],
  );

  return (
    <div className="space-y-6">
      {/* ── Header row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Instruction Analytics</h2>
          {newErrorCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              {newErrorCount} New Error{newErrorCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Window selector */}
          <div className="flex rounded-lg border bg-muted/40 p-0.5">
            {WINDOWS.map((w) => (
              <button
                key={w.hours}
                onClick={() => setWindowHours(w.hours)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  windowHours === w.hours
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOverview()}
            disabled={isRefetching}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Calls"
          value={formatNumber(ov?.totalCalls)}
          icon={<Activity className="h-3.5 w-3.5" />}
          loading={overviewLoading}
        />
        <KpiCard
          label="Success Rate"
          value={pct(ov?.successRate)}
          icon={<CheckCircle className="h-3.5 w-3.5" />}
          loading={overviewLoading}
          color={
            (ov?.successRate ?? 0) >= 95
              ? 'text-green-600'
              : (ov?.successRate ?? 0) >= 80
              ? 'text-yellow-600'
              : 'text-red-600'
          }
        />
        <KpiCard
          label="Error Rate"
          value={pct(ov?.errorRate)}
          icon={<XCircle className="h-3.5 w-3.5" />}
          loading={overviewLoading}
          color={(ov?.errorRate ?? 0) > 20 ? 'text-red-600' : (ov?.errorRate ?? 0) > 5 ? 'text-yellow-600' : 'text-foreground'}
        />
        <KpiCard
          label="Avg Compute Units"
          value={formatNumber(ov?.avgComputeUnits)}
          icon={<Zap className="h-3.5 w-3.5" />}
          loading={overviewLoading}
          sub="per instruction"
        />
      </div>

      {/* ── Instructions Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Instructions</CardTitle>
          <CardDescription className="text-xs">
            Click a row to expand per-instruction details
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {overviewLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : instructions.length === 0 ? (
            <div className="p-4">
              <EmptyState />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-6" />
                    <TableHead className="text-xs">Method Name</TableHead>
                    <TableHead className="text-xs text-right">Calls</TableHead>
                    <TableHead className="text-xs text-right">Share %</TableHead>
                    <TableHead className="text-xs text-right">Success Rate</TableHead>
                    <TableHead className="text-xs text-right">Error Rate</TableHead>
                    <TableHead className="text-xs text-right">Avg CU</TableHead>
                    <TableHead className="text-xs">Top Error</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructions.map((row) => {
                    const isExpanded = selectedInstruction === row.name;
                    return (
                      <>
                        <TableRow
                          key={row.name}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleRowClick(row.name)}
                        >
                          {/* Expand chevron */}
                          <TableCell className="pr-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>

                          {/* Method name */}
                          <TableCell className="font-mono text-xs font-medium">
                            {row.name}
                          </TableCell>

                          {/* Calls */}
                          <TableCell className="text-right text-xs">
                            {formatNumber(row.calls)}
                          </TableCell>

                          {/* Share % */}
                          <TableCell className="text-right text-xs">
                            <div className="flex items-center justify-end gap-1.5">
                              <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${Math.min(row.sharePercent, 100)}%` }}
                                />
                              </div>
                              {pct(row.sharePercent)}
                            </div>
                          </TableCell>

                          {/* Success Rate */}
                          <TableCell className="text-right text-xs">
                            <span
                              className={
                                row.successRate >= 95
                                  ? 'text-green-600 font-medium'
                                  : row.successRate >= 80
                                  ? 'text-yellow-600 font-medium'
                                  : 'text-red-600 font-medium'
                              }
                            >
                              {pct(row.successRate)}
                            </span>
                          </TableCell>

                          {/* Error Rate */}
                          <TableCell className="text-right text-xs">
                            <span
                              className={
                                row.errorRate > 20
                                  ? 'text-red-600'
                                  : row.errorRate > 5
                                  ? 'text-yellow-600'
                                  : 'text-muted-foreground'
                              }
                            >
                              {pct(row.errorRate)}
                            </span>
                          </TableCell>

                          {/* Avg CU */}
                          <TableCell className="text-right text-xs">
                            {formatNumber(row.avgComputeUnits)}
                          </TableCell>

                          {/* Top Error */}
                          <TableCell className="text-xs">
                            {row.topError ? (
                              <span className="font-mono text-red-500">{row.topError}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <StatusDot status={row.status} />
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <TableRow key={`${row.name}-detail`} className="hover:bg-transparent">
                            <TableCell colSpan={9} className="p-0 pb-2">
                              <InstructionDetail
                                programId={programDbId}
                                instructionName={row.name}
                                windowHours={windowHours}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Live Log ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live Log
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Most recent instruction calls — refreshes every 15s
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : logEntries.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
              <Activity className="h-4 w-4" />
              No recent transactions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Signature</TableHead>
                    <TableHead className="text-xs">Instruction</TableHead>
                    <TableHead className="text-xs">Result</TableHead>
                    <TableHead className="text-xs text-right">CU Used</TableHead>
                    <TableHead className="text-xs">Caller</TableHead>
                    <TableHead className="text-xs text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logEntries.map((entry) => (
                    <LogRow key={entry.id ?? entry.signature} entry={entry} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── New Errors Panel (if any) ── */}
      {newErrorCount > 0 && newErrors?.errors && newErrors.errors.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              New Error Codes Detected
            </CardTitle>
            <CardDescription className="text-xs">
              These error codes appeared for the first time in the last {windowHours}h
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {newErrors.errors.map((err) => (
                <div
                  key={err.errorCode}
                  className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs"
                >
                  <span className="font-mono font-medium text-red-600">{err.errorCode}</span>
                  {err.errorName && (
                    <span className="text-muted-foreground">— {err.errorName}</span>
                  )}
                  <span className="text-muted-foreground">
                    first seen {formatRelativeTime(err.firstSeen)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MethodsTab;

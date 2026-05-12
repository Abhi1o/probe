'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { usePrograms } from '@/hooks/use-programs';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlusIcon, Activity, TrendingUp, AlertTriangle, Loader2,
  Shield, GitBranch, Users, Zap, CheckCircle, XCircle,
  TrendingDown, Minus, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';

// ─── Mini health score badge ──────────────────────────────────────────────────
function HealthBadge({ programId }: { programId: string }) {
  const { data } = useQuery({
    queryKey: ['health', programId],
    queryFn: async () => (await apiClient.get(`/programs/${programId}/health`)).data,
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return <Skeleton className="h-6 w-16" />;

  const score = data.score as number;
  const grade = data.grade as string;
  const trend = data.trend as string;

  const color =
    score >= 90 ? 'text-green-600 bg-green-50 border-green-200'
    : score >= 75 ? 'text-blue-600 bg-blue-50 border-blue-200'
    : score >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : score >= 40 ? 'text-orange-600 bg-orange-50 border-orange-200'
    : 'text-red-600 bg-red-50 border-red-200';

  const TrendIcon = trend === 'improving' ? ArrowUpRight : trend === 'declining' ? ArrowDownRight : Minus;
  const trendColor = trend === 'improving' ? 'text-green-500' : trend === 'declining' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${color}`}>
        <Shield className="h-3 w-3" />
        {score} ({grade})
      </span>
      <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
    </div>
  );
}

// ─── System-wide health overview ──────────────────────────────────────────────
function SystemHealthOverview({ programs }: { programs: any[] }) {
  const healthQueries = useQueries({
    queries: programs.map((p) => ({
      queryKey: ['health', p.id],
      queryFn: async () => (await apiClient.get(`/programs/${p.id}/health`)).data,
      enabled: !!p.id,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const scores = healthQueries
    .map((query) => query.data?.score ?? null)
    .filter((score) => score !== null) as number[];
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const criticalCount = scores.filter(s => s < 60).length;
  const healthyCount = scores.filter(s => s >= 90).length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Avg Health Score</span>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          {avgScore === null ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className={`text-2xl font-bold ${avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {avgScore}/100
              </div>
              <Link href="/docs/health" className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 mt-1">
                Learn how scores are calculated <ArrowUpRight className="h-2 w-2" />
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Healthy Programs</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
          <p className="text-xs text-muted-foreground">score ≥ 90</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Need Attention</span>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          <p className="text-xs text-muted-foreground">score &lt; 60</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Total Transactions</span>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {formatNumber(programs.reduce((acc, p) => acc + (p._count?.transactions || 0), 0))}
          </div>
          <p className="text-xs text-muted-foreground">all time</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { programs, isLoading } = usePrograms();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring for your Solana programs
          </p>
        </div>
        <Link href="/programs/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Program
          </Button>
        </Link>
      </div>

      {/* System Health Overview */}
      {!isLoading && programs && programs.length > 0 && (
        <SystemHealthOverview programs={programs} />
      )}

      {/* Programs Grid with Health Scores */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Programs</h2>
          <Link href="/programs">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : programs && programs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {programs.slice(0, 6).map((program) => (
              <Link key={program.id} href={`/programs/${program.id}`}>
                <Card className="transition-all hover:shadow-md cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{program.name}</CardTitle>
                        <CardDescription className="font-mono text-xs mt-0.5">
                          {program.programId.slice(0, 8)}...{program.programId.slice(-6)}
                        </CardDescription>
                      </div>
                      <Badge variant={program.isActive ? 'success' : 'secondary'} className="flex-shrink-0 text-xs">
                        {program.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Health Score */}
                    <HealthBadge programId={program.id} />

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">Txs</p>
                        <p className="text-sm font-semibold">{formatNumber(program._count?.transactions || 0)}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">Alerts</p>
                        <p className="text-sm font-semibold">{program._count?.alerts || 0}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-xs text-muted-foreground">Network</p>
                        <p className="text-xs font-semibold truncate">{program.network.replace('_BETA', '')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No programs yet</h3>
              <p className="mb-4 text-muted-foreground">Get started by adding your first program</p>
              <Link href="/programs/new">
                <Button><PlusIcon className="mr-2 h-4 w-4" />Add Program</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: <Shield className="h-5 w-5 text-green-500" />,
            title: 'Health Scores',
            desc: 'Real-time program health computed from success rate, compute efficiency, and user activity',
            href: programs?.[0] ? `/programs/${programs[0].id}?tab=health` : '/programs',
            color: 'border-green-200 bg-green-50/30',
          },
          {
            icon: <GitBranch className="h-5 w-5 text-indigo-500" />,
            title: 'CPI Analysis',
            desc: 'Unique Solana feature — visualize cross-program invocation dependencies and risk',
            href: programs?.[0] ? `/programs/${programs[0].id}?tab=cpi` : '/programs',
            color: 'border-indigo-200 bg-indigo-50/30',
          },
          {
            icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
            title: 'MEV Detection',
            desc: 'Detect sandwich attacks, front-running, and bot activity affecting your users',
            href: programs?.[0] ? `/programs/${programs[0].id}?tab=mev` : '/programs',
            color: 'border-orange-200 bg-orange-50/30',
          },
          {
            icon: <Users className="h-5 w-5 text-blue-500" />,
            title: 'Wallet Intelligence',
            desc: 'Classify wallets as bots, whales, smart money, or retail users automatically',
            href: programs?.[0] ? `/programs/${programs[0].id}?tab=wallets` : '/programs',
            color: 'border-blue-200 bg-blue-50/30',
          },
        ].map(({ icon, title, desc, href, color }) => (
          <Link key={title} href={href}>
            <Card className={`h-full cursor-pointer transition-all hover:shadow-md border ${color}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {icon}
                  <span className="font-semibold text-sm">{title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/programs/new">
              <Button variant="outline" className="w-full justify-start">
                <PlusIcon className="mr-2 h-4 w-4" />Add New Program
              </Button>
            </Link>
            <Link href="/alerts">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />Configure Alerts
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />View Analytics
              </Button>
            </Link>
            <Link href="/transactions">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />Browse Transactions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Features</CardTitle>
            <CardDescription>What Probe monitors for you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Real-time transaction indexing' },
                { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Program health scores (A+ to F)' },
                { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'CPI dependency graph analysis' },
                { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'MEV sandwich attack detection' },
                { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Wallet intelligence classification' },
                { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Instruction-level analytics' },
                { icon: <CheckCircle className="h-4 w-4 text-green-500" />, text: 'Configurable alerts & notifications' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm">
                  {icon}
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

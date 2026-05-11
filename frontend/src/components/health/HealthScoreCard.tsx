'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, TrendingDown, Minus, Shield, Zap, Activity,
  AlertTriangle, Users, CheckCircle, Info, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComponentScore {
  score: number;
  label: string;
  detail: string;
}

interface HealthScore {
  programId: string;
  programName: string;
  score: number;
  grade: string;
  trend: string;
  components: {
    reliability: ComponentScore;
    performance: ComponentScore;
    activity: ComponentScore;
    errors: ComponentScore;
    users: ComponentScore;
  };
  metrics: {
    successRate24h: number;
    successRate7d: number;
    avgComputeUnits24h: number;
    errorRate24h: number;
    txCount24h: number;
    txCount7d: number;
    uniqueUsers24h: number;
    uniqueUsers7d: number;
    topErrorCode: string | null;
    topErrorCount: number;
  };
  strengths: string[];
  warnings: string[];
  recommendations: string[];
  computedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function scoreBg(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-blue-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-green-600 bg-green-50 border-green-200';
  if (grade === 'B') return 'text-blue-600 bg-blue-50 border-blue-200';
  if (grade === 'C') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (grade === 'D') return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function ComponentBar({ label, score, detail, icon }: {
  label: string; score: number; detail: string; icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{detail}</span>
          <span className={`font-semibold text-sm ${scoreColor(score)}`}>{score}</span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreBg(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Circular Score Gauge ─────────────────────────────────────────────────────

function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 90 ? '#22c55e'
    : score >= 75 ? '#3b82f6'
    : score >= 60 ? '#f59e0b'
    : score >= 40 ? '#f97316'
    : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        {/* Background track */}
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/30"
        />
        {/* Score arc */}
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${gradeColor(grade)}`}>
          {grade}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface HealthScoreCardProps {
  programId: string;
}

export function HealthScoreCard({ programId }: HealthScoreCardProps) {
  const { data, isLoading, refetch, isRefetching } = useQuery<HealthScore>({
    queryKey: ['health', programId],
    queryFn: async () => {
      const res = await apiClient.get(`/programs/${programId}/health`);
      return res.data;
    },
    enabled: !!programId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 min
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { score, grade, trend, components, metrics, strengths, warnings, recommendations } = data;

  return (
    <div className="space-y-4">
      {/* ── Main Score Card ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Program Health Score
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Computed from success rate, compute efficiency, activity, errors, and user metrics
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Gauge */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <ScoreGauge score={score} grade={grade} />
              <div className="flex items-center gap-1.5 text-sm">
                <TrendIcon trend={trend} />
                <span className="text-muted-foreground capitalize">{trend}</span>
              </div>
            </div>

            {/* Component bars */}
            <div className="flex-1 space-y-3">
              <ComponentBar
                label="Reliability"
                score={components.reliability.score}
                detail={components.reliability.detail}
                icon={<CheckCircle className="h-3.5 w-3.5" />}
              />
              <ComponentBar
                label="Performance"
                score={components.performance.score}
                detail={components.performance.detail}
                icon={<Zap className="h-3.5 w-3.5" />}
              />
              <ComponentBar
                label="Activity"
                score={components.activity.score}
                detail={components.activity.detail}
                icon={<Activity className="h-3.5 w-3.5" />}
              />
              <ComponentBar
                label="Error Health"
                score={components.errors.score}
                detail={components.errors.detail}
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
              />
              <ComponentBar
                label="User Engagement"
                score={components.users.score}
                detail={components.users.detail}
                icon={<Users className="h-3.5 w-3.5" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Metrics Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Success Rate (24h)', value: `${(metrics.successRate24h * 100).toFixed(1)}%`, color: metrics.successRate24h >= 0.97 ? 'text-green-600' : metrics.successRate24h >= 0.90 ? 'text-yellow-600' : 'text-red-600' },
          { label: 'Error Rate (24h)', value: `${(metrics.errorRate24h * 100).toFixed(1)}%`, color: metrics.errorRate24h <= 0.01 ? 'text-green-600' : metrics.errorRate24h <= 0.05 ? 'text-yellow-600' : 'text-red-600' },
          { label: 'Transactions (24h)', value: metrics.txCount24h.toLocaleString(), color: 'text-foreground' },
          { label: 'Unique Wallets (24h)', value: metrics.uniqueUsers24h.toLocaleString(), color: 'text-foreground' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Strengths & Warnings ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Strengths */}
        {strengths.length > 0 && (
          <Card className="border-green-200 bg-green-50/40 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400">
                    <span className="mt-0.5 flex-shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <span className="mt-0.5 flex-shrink-0">⚠</span>
                    {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400">
                  <span className="mt-0.5 flex-shrink-0">→</span>
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Score explanation ── */}
      <Card className="border-muted">
        <CardContent className="pt-3 pb-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">How scores are calculated: </span>
            Reliability (35%) · Error Health (25%) · Performance (20%) · Activity (10%) · User Engagement (10%).
            Scores refresh every 5 minutes. Last computed: {new Date(data.computedAt).toLocaleTimeString()}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthScoreCard;

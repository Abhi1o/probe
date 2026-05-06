'use client';

import { useState } from 'react';
import { usePrograms } from '@/hooks/use-programs';
import { 
  useTopPrograms, 
  useProgramMetrics,
  useTransactionDistribution,
  useHourlyActivity,
  useComputeEfficiency,
  useTopSigners,
  useErrorBreakdown,
} from '@/hooks/use-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users,
  AlertCircle,
} from 'lucide-react';
import { formatNumber, formatPercentage, formatAddress } from '@/lib/utils';
import Link from 'next/link';
import { ChartContainer } from '@/components/charts/ChartContainer';
import { TransactionTrendChart } from '@/components/charts/TransactionTrendChart';
import { SuccessRateChart } from '@/components/charts/SuccessRateChart';
import { DistributionPieChart } from '@/components/charts/DistributionPieChart';
import { ComputeUnitsChart } from '@/components/charts/ComputeUnitsChart';
import { HourlyActivityChart } from '@/components/charts/HourlyActivityChart';

export default function AnalyticsPage() {
  const { programs } = usePrograms();
  const [period, setPeriod] = useState('24h');
  const { data: topPrograms } = useTopPrograms(10, period);

  // Get first program for detailed analytics
  const firstProgram = programs?.[0];
  const { data: metrics, isLoading: metricsLoading } = useProgramMetrics(firstProgram?.id || '', period);
  const { data: distribution, isLoading: distLoading } = useTransactionDistribution(firstProgram?.id || '', period);
  const { data: hourlyData, isLoading: hourlyLoading } = useHourlyActivity(firstProgram?.id || '');
  const { data: computeData, isLoading: computeLoading } = useComputeEfficiency(firstProgram?.id || '', period);
  const { data: topSigners, isLoading: signersLoading } = useTopSigners(firstProgram?.id || '', period, 10);
  const { data: errors, isLoading: errorsLoading } = useErrorBreakdown(firstProgram?.id || '', period);

  // Calculate overall stats
  const totalTransactions = programs?.reduce((acc, p) => acc + (p._count?.transactions || 0), 0) || 0;
  const totalPrograms = programs?.length || 0;
  const activePrograms = programs?.filter(p => p.isActive).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and metrics across all your programs
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              {activePrograms} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalTransactions)}</div>
            <p className="text-xs text-muted-foreground">
              Across all programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topPrograms && topPrograms.length > 0
                ? `${(topPrograms.reduce((acc, p) => acc + (p.successRate || 0), 0) / topPrograms.length).toFixed(1)}%`
                : '98.5%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topSigners ? formatNumber(topSigners.length * 100) : '1,234'}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique wallets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Transaction Trends */}
            <ChartContainer
              title="Transaction Trends"
              description="Transaction volume over time"
              loading={metricsLoading}
              error={!metrics || (Array.isArray(metrics) && metrics.length === 0) ? 'No data available' : undefined}
            >
              {metrics && Array.isArray(metrics) && metrics.length > 0 && (
                <TransactionTrendChart data={metrics} showSuccessFail={false} />
              )}
            </ChartContainer>

            {/* Success Rate */}
            <ChartContainer
              title="Success Rate"
              description="Transaction success over time"
              loading={metricsLoading}
              error={!metrics || (Array.isArray(metrics) && metrics.length === 0) ? 'No data available' : undefined}
            >
              {metrics && Array.isArray(metrics) && metrics.length > 0 && (
                <SuccessRateChart data={metrics} />
              )}
            </ChartContainer>

            {/* Distribution */}
            <ChartContainer
              title="Success/Failure Distribution"
              description={`Transaction outcomes in the last ${period}`}
              loading={distLoading}
              error={!distribution ? 'No data available' : undefined}
            >
              {distribution && (
                <DistributionPieChart 
                  success={distribution.success} 
                  failed={distribution.failed} 
                />
              )}
            </ChartContainer>

            {/* Hourly Activity */}
            <ChartContainer
              title="Hourly Activity (Today)"
              description="Transaction distribution by hour"
              loading={hourlyLoading}
              error={!hourlyData || hourlyData.length === 0 ? 'No data available' : undefined}
            >
              {hourlyData && hourlyData.length > 0 && (
                <HourlyActivityChart data={hourlyData} />
              )}
            </ChartContainer>
          </div>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Programs</CardTitle>
              <CardDescription>
                Most active programs in the last {period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topPrograms && topPrograms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Compute</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPrograms.map((program, index) => (
                      <TableRow key={program.programId}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>
                          <Link 
                            href={`/programs/${program.id}`}
                            className="hover:text-blue-600 font-medium"
                          >
                            {program.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {formatAddress(program.programId)}
                          </div>
                        </TableCell>
                        <TableCell>{formatNumber(program.transactionCount)}</TableCell>
                        <TableCell>
                          <Badge variant={(program.successRate ?? 0) > 95 ? 'default' : 'secondary'}>
                            {formatPercentage(program.successRate)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {program.avgComputeUnits 
                            ? formatNumber(program.avgComputeUnits) 
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No data available</h3>
                  <p className="text-muted-foreground">
                    Analytics will appear once your programs start receiving transactions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Compute Units */}
            <ChartContainer
              title="Compute Units Distribution"
              description="Transaction distribution by compute usage"
              loading={computeLoading}
              error={!computeData?.distribution ? 'No data available' : undefined}
            >
              {computeData?.distribution && computeData.distribution.length > 0 && (
                <ComputeUnitsChart data={computeData.distribution} />
              )}
            </ChartContainer>

            {/* Compute Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Compute Efficiency</CardTitle>
                <CardDescription>Average usage vs 1.4M budget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {computeLoading ? (
                  <div className="h-[252px] flex items-center justify-center">
                    <div className="text-muted-foreground">Loading...</div>
                  </div>
                ) : computeData ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average CU</span>
                        <span className="font-medium">{formatNumber(computeData.avgCu)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Utilization</span>
                        <span className="font-medium">{computeData.avgUtilization.toFixed(1)}%</span>
                      </div>
                      <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${Math.min(computeData.avgUtilization, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground">Min CU</div>
                        <div className="text-lg font-semibold">{formatNumber(computeData.minCu)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Max CU</div>
                        <div className="text-lg font-semibold">{formatNumber(computeData.maxCu)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Median CU</div>
                        <div className="text-lg font-semibold">{formatNumber(computeData.medianCu)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">P95 CU</div>
                        <div className="text-lg font-semibold">{formatNumber(computeData.p95Cu)}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-[252px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Fees Trend */}
            <ChartContainer
              title="Average Transaction Fees"
              description="Fee trends over time"
              loading={metricsLoading}
              error={!metrics || (Array.isArray(metrics) && metrics.length === 0) ? 'No data available' : undefined}
            >
              {metrics && Array.isArray(metrics) && metrics.length > 0 && (
                <TransactionTrendChart 
                  data={metrics.map(m => ({ 
                    timestamp: m.timestamp, 
                    count: m.avgFee / 1e9 
                  }))} 
                />
              )}
            </ChartContainer>

            {/* Success vs Failed Trend */}
            <ChartContainer
              title="Success vs Failed Transactions"
              description="Transaction outcomes over time"
              loading={metricsLoading}
              error={!metrics || (Array.isArray(metrics) && metrics.length === 0) ? 'No data available' : undefined}
            >
              {metrics && Array.isArray(metrics) && metrics.length > 0 && (
                <TransactionTrendChart data={metrics} showSuccessFail={true} />
              )}
            </ChartContainer>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {/* Top Callers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Callers</CardTitle>
                <CardDescription>Most active wallets in the last {period}</CardDescription>
              </CardHeader>
              <CardContent>
                {signersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading...</div>
                  </div>
                ) : topSigners && topSigners.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Transactions</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Total Fees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSigners.map((signer, index) => (
                        <TableRow key={signer.signer}>
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatAddress(signer.signer, 6)}
                          </TableCell>
                          <TableCell>{formatNumber(signer.txCount)}</TableCell>
                          <TableCell>
                            <Badge variant={Number(signer.successRate) > 95 ? 'default' : 'secondary'}>
                              {signer.successRate}%
                            </Badge>
                          </TableCell>
                          <TableCell>{(signer.totalFees / 1e9).toFixed(6)} SOL</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No caller data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Error Breakdown</CardTitle>
                <CardDescription>Most common error types in the last {period}</CardDescription>
              </CardHeader>
              <CardContent>
                {errorsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading...</div>
                  </div>
                ) : errors && errors.length > 0 ? (
                  <div className="space-y-4">
                    {errors.map((error, index) => {
                      const totalErrors = errors.reduce((sum, e) => sum + e.count, 0);
                      const percentage = (error.count / totalErrors) * 100;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-medium truncate max-w-[300px]">
                                {error.errorType}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{formatNumber(error.count)}</span>
                              <span className="text-xs text-muted-foreground">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No errors found - Great job!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

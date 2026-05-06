'use client';

import { usePrograms } from '@/hooks/use-programs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, Activity, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { programs, isLoading } = usePrograms();

  // Calculate stats
  const stats = {
    totalPrograms: programs?.length || 0,
    totalTransactions: programs?.reduce((acc, p) => acc + (p._count?.transactions || 0), 0) || 0,
    activeAlerts: programs?.reduce((acc, p) => acc + (p._count?.alerts || 0), 0) || 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your Solana programs in real-time
          </p>
        </div>
        <Link href="/programs/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Program
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              Active programs monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Transactions processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Alert rules configured
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Programs Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Programs</h2>
          <Link href="/programs">
            <Button variant="outline" size="sm">
              View All
            </Button>
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
                <Card className="transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {program.programId.slice(0, 8)}...{program.programId.slice(-8)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">Transactions</p>
                        <p className="font-semibold">
                          {program._count?.transactions || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Network</p>
                        <p className="font-semibold capitalize">{program.network}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-semibold">
                          {program.isActive ? (
                            <span className="text-green-600">Active</span>
                          ) : (
                            <span className="text-gray-400">Inactive</span>
                          )}
                        </p>
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
              <p className="mb-4 text-muted-foreground">
                Get started by adding your first program
              </p>
              <Link href="/programs/new">
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Program
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/programs/new">
              <Button variant="outline" className="w-full justify-start">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add New Program
              </Button>
            </Link>
            <Link href="/alerts">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Configure Alerts
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn how to use Probe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-lg border p-3">
              <h4 className="font-medium">1. Add a Program</h4>
              <p className="text-sm text-muted-foreground">
                Register your Solana program to start monitoring
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="font-medium">2. Configure Alerts</h4>
              <p className="text-sm text-muted-foreground">
                Set up notifications for important events
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <h4 className="font-medium">3. Monitor in Real-time</h4>
              <p className="text-sm text-muted-foreground">
                Watch transactions and metrics as they happen
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

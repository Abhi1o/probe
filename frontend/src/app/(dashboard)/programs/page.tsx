'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrograms } from '@/hooks/use-programs';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon, Search, Activity, AlertCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import { formatAddress, formatNumber } from '@/lib/utils';

// ─── Mini health badge shown on each program card ─────────────────────────────
function HealthBadge({ programId }: { programId: string }) {
  const { data } = useQuery({
    queryKey: ['health', programId],
    queryFn: async () => (await apiClient.get(`/programs/${programId}/health`)).data,
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;

  const score = data.score as number;
  const grade = data.grade as string;

  const color =
    score >= 90 ? 'text-green-600 bg-green-50 border-green-200'
    : score >= 75 ? 'text-blue-600 bg-blue-50 border-blue-200'
    : score >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : score >= 40 ? 'text-orange-600 bg-orange-50 border-orange-200'
    : 'text-red-600 bg-red-50 border-red-200';

  return (
    <div className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Shield className="h-3 w-3" />
      {score} <span className="opacity-70">({grade})</span>
    </div>
  );
}

export default function ProgramsPage() {
  const { programs, isLoading } = usePrograms();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrograms = programs?.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.programId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Programs</h1>
          <p className="text-muted-foreground">
            Manage and monitor your Solana programs
          </p>
        </div>
        <Link href="/programs/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Program
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or program ID..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPrograms && filteredPrograms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => (
            <Link key={program.id} href={`/programs/${program.id}`}>
              <Card className="transition-all hover:shadow-lg cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{program.name}</CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">
                        {formatAddress(program.programId, 6)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <Badge variant={program.isActive ? 'success' : 'secondary'}>
                        {program.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <HealthBadge programId={program.id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Network */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <Badge variant="outline" className="capitalize">
                      {program.network}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-muted-foreground text-xs">
                        <Activity className="mr-1 h-3 w-3" />
                        Transactions
                      </div>
                      <div className="text-lg font-semibold">
                        {formatNumber(program._count?.transactions || 0)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center text-muted-foreground text-xs">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Alerts
                      </div>
                      <div className="text-lg font-semibold">
                        {program._count?.alerts || 0}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {program.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {program.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {searchQuery ? 'No programs found' : 'No programs yet'}
            </h3>
            <p className="mb-4 text-muted-foreground text-center">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by adding your first program'}
            </p>
            {!searchQuery && (
              <Link href="/programs/new">
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Program
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


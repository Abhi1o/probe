'use client';

import { useState, useMemo } from 'react';
import { usePrograms } from '@/hooks/use-programs';
import { useTransactions, useAllTransactions } from '@/hooks/use-transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, ExternalLink, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import { formatAddress, formatRelativeTime } from '@/lib/utils';

export default function TransactionsPage() {
  const { programs } = usePrograms();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Fetch transactions - either for a specific program or all programs
  const programQuery = useTransactions(
    selectedProgram,
    {
      limit,
      offset,
      status: statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined,
    }
  );

  const allQuery = useAllTransactions({
    limit,
    offset,
    status: statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined,
  });

  // Use the appropriate query based on selected program
  const { data: transactionData, isLoading, error } = selectedProgram === 'all' ? allQuery : programQuery;

  // Get program name lookup
  const programLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    programs?.forEach(p => {
      lookup[p.id] = p.name;
    });
    return lookup;
  }, [programs]);

  // Filter transactions by search query
  const filteredTransactions = useMemo(() => {
    if (!transactionData?.data) return [];
    
    let filtered = transactionData.data;
    
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.signature.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.signer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [transactionData, searchQuery]);

  const transactions = filteredTransactions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Explore and analyze all transactions across your programs
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transactions by program, status, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search signature..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Program Filter */}
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading transactions...
              </span>
            ) : error ? (
              <span className="text-destructive">Error loading transactions</span>
            ) : (
              <>
                {transactions.length} of {transactionData?.total || 0} transactions
                {selectedProgram !== 'all' && ` for ${programLookup[selectedProgram] || 'selected program'}`}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error loading transactions</h3>
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Signature</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Compute Units</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.signature}>
                    <TableCell className="font-mono text-sm">
                      {formatAddress(tx.signature, 6)}
                    </TableCell>
                    <TableCell>
                      {tx.programId ? programLookup[tx.programId] || formatAddress(tx.programId, 4) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {tx.status === 'SUCCESS' ? (
                        <Badge variant="success" className="flex items-center w-fit">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center w-fit">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{BigInt(tx.slot).toLocaleString()}</TableCell>
                    <TableCell>
                      {tx.fee != null && !isNaN(Number(tx.fee)) 
                        ? `${(Number(tx.fee) / 1e9).toFixed(6)} SOL` 
                        : '0.000000 SOL'}
                    </TableCell>
                    <TableCell>{tx.computeUnits?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(new Date(tx.blockTime))}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=${
                          programs?.find(p => p.id === tx.programId)?.network || 'devnet'
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {selectedProgram === 'all' 
                  ? 'Please select a specific program to view transactions'
                  : searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No transactions found for this program'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {transactions.length > 0 && transactionData && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + limit, transactionData.total)} of {transactionData.total} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= transactionData.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

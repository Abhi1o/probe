'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { usePrograms } from '@/hooks/use-programs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const programSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  programId: z.string().length(44, 'Program ID must be 44 characters (Base58 address)'),
  network: z.enum(['mainnet-beta', 'devnet', 'testnet']),
  description: z.string().optional(),
  repositoryUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type ProgramFormData = z.infer<typeof programSchema>;

export default function NewProgramPage() {
  const router = useRouter();
  const { createProgram, isCreating } = usePrograms();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      network: 'mainnet-beta',
    },
  });

  const network = watch('network');

  const onSubmit = (data: ProgramFormData) => {
    createProgram(data, {
      onSuccess: () => {
        router.push('/programs');
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/programs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Programs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add New Program</h1>
        <p className="text-muted-foreground">
          Register a Solana program to start monitoring
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Program Details</CardTitle>
          <CardDescription>
            Enter the details of the Solana program you want to monitor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Program Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Program Name *</Label>
              <Input
                id="name"
                placeholder="My DEX Program"
                {...register('name')}
                disabled={isCreating}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Program ID */}
            <div className="space-y-2">
              <Label htmlFor="programId">Program ID *</Label>
              <Input
                id="programId"
                placeholder="11111111111111111111111111111111"
                className="font-mono text-sm"
                {...register('programId')}
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                The Base58-encoded public key of your Solana program (44 characters)
              </p>
              {errors.programId && (
                <p className="text-sm text-red-500">{errors.programId.message}</p>
              )}
            </div>

            {/* Network */}
            <div className="space-y-2">
              <Label htmlFor="network">Network *</Label>
              <Select
                value={network}
                onValueChange={(value) => setValue('network', value as any)}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainnet-beta">Mainnet Beta</SelectItem>
                  <SelectItem value="devnet">Devnet</SelectItem>
                  <SelectItem value="testnet">Testnet</SelectItem>
                </SelectContent>
              </Select>
              {errors.network && (
                <p className="text-sm text-red-500">{errors.network.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="A brief description of your program"
                {...register('description')}
                disabled={isCreating}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Repository URL */}
            <div className="space-y-2">
              <Label htmlFor="repositoryUrl">Repository URL (Optional)</Label>
              <Input
                id="repositoryUrl"
                type="url"
                placeholder="https://github.com/username/repo"
                {...register('repositoryUrl')}
                disabled={isCreating}
              />
              {errors.repositoryUrl && (
                <p className="text-sm text-red-500">{errors.repositoryUrl.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center space-x-4">
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? 'Creating...' : 'Create Program'}
              </Button>
              <Link href="/programs">
                <Button type="button" variant="outline" disabled={isCreating}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">💡 What happens next?</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Your program will be registered in the monitoring system</li>
            <li>• Transactions will be automatically indexed from the blockchain</li>
            <li>• You can configure alerts and view analytics</li>
            <li>• Real-time updates will be available via WebSocket</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

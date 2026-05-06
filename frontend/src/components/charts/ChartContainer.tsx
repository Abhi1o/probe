import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function ChartContainer({
  title,
  description,
  children,
  loading = false,
  error,
  className = '',
}: ChartContainerProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px]">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

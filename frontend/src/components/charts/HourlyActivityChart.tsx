import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface HourlyData {
  hour: number;
  timestamp: string;
  count: number;
  successCount: number;
  failureCount: number;
}

interface HourlyActivityChartProps {
  data: HourlyData[];
}

export function HourlyActivityChart({ data }: HourlyActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="timestamp" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => formatNumber(value)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={(value: number) => formatNumber(value)}
        />
        <Legend />
        <Bar dataKey="successCount" stackId="a" fill="#10b981" name="Success" radius={[4, 4, 0, 0]} />
        <Bar dataKey="failureCount" stackId="a" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

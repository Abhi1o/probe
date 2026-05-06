import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface DataPoint {
  timestamp: string | Date;
  count: number;
  successCount?: number;
  failureCount?: number;
}

interface TransactionTrendChartProps {
  data: DataPoint[];
  showSuccessFail?: boolean;
}

export function TransactionTrendChart({ data, showSuccessFail = false }: TransactionTrendChartProps) {
  const formattedData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    total: d.count,
    success: d.successCount || 0,
    failed: d.failureCount || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="time" 
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
        {showSuccessFail ? (
          <>
            <Line
              type="monotone"
              dataKey="success"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Success"
            />
            <Line
              type="monotone"
              dataKey="failed"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Failed"
            />
          </>
        ) : (
          <Line
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Transactions"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

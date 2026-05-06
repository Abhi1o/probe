import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface DistributionPieChartProps {
  success: number;
  failed: number;
}

const COLORS = {
  success: '#10b981',
  failed: '#ef4444',
};

export function DistributionPieChart({ success, failed }: DistributionPieChartProps) {
  const data = [
    { name: 'Success', value: success, color: COLORS.success },
    { name: 'Failed', value: failed, color: COLORS.failed },
  ];

  const total = success + failed;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${formatNumber(value)} (${((value / total) * 100).toFixed(1)}%)`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={(value: number) => [formatNumber(value), '']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

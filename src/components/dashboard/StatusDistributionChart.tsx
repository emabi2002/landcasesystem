'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface StatusDistributionChartProps {
  data: Array<{ name: string; value: number }>;
}

// Professional color palette with better contrast
const STATUS_COLORS: Record<string, string> = {
  'under_review': '#F59E0B',
  'in_court': '#3B82F6',
  'mediation': '#8B5CF6',
  'tribunal': '#F97316',
  'judgment': '#6366F1',
  'closed': '#6B7280',
  'settled': '#10B981',
};

const FALLBACK_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

const getStatusColor = (name: string, index: number): string => {
  const normalized = name.toLowerCase().replace(/\s+/g, '_');
  return STATUS_COLORS[normalized] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

const formatStatusLabel = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-slate-900">{formatStatusLabel(data.name)}</p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">{data.value}</span> cases
        </p>
        <p className="text-xs text-slate-500">
          {((data.payload.percent || 0) * 100).toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null; // Don't show label for slices less than 5%
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">Cases by Status</CardTitle>
        <CardDescription className="text-xs">Current distribution of case statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getStatusColor(entry.name, index)}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-slate-600">{formatStatusLabel(value)}</span>
              )}
            />
            {/* Center label */}
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
              <tspan x="50%" dy="-0.3em" className="text-2xl font-bold fill-slate-900">
                {total}
              </tspan>
              <tspan x="50%" dy="1.4em" className="text-xs fill-slate-500">
                Total
              </tspan>
            </text>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

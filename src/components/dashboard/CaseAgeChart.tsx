'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CaseAgeChartProps {
  data: Array<{ name: string; value: number }>;
}

// Color scale from green (recent) to red (old)
const getAgeColor = (name: string): string => {
  const ageColors: Record<string, string> = {
    '0-30 days': '#10B981',
    '31-90 days': '#3B82F6',
    '91-180 days': '#F59E0B',
    '181-365 days': '#F97316',
    '1-2 years': '#EF4444',
    '2+ years': '#DC2626',
  };
  return ageColors[name] || '#6B7280';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-600 mt-1">
          <span className="font-semibold text-lg">{data.value}</span>
          <span className="ml-1">open cases</span>
        </p>
      </div>
    );
  }
  return null;
};

export function CaseAgeChart({ data }: CaseAgeChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const oldCases = data
    .filter(d => d.name.includes('year') || d.name.includes('181'))
    .reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Outstanding Cases by Age</CardTitle>
            <CardDescription className="text-xs">How long open cases have been active</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Older than 180 days</p>
            <p className={`font-semibold ${oldCases > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {oldCases} ({total > 0 ? ((oldCases / total) * 100).toFixed(0) : 0}%)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={90}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getAgeColor(entry.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Age distribution legend */}
        <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Recent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-500">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-slate-500">Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

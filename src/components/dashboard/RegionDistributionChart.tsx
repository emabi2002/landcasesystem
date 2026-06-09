'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RegionDistributionChartProps {
  data: Array<{ name: string; value: number }>;
}

// Color palette for regions
const REGION_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#EC4899', '#84CC16'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = data.payload.total || 0;
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-600 mt-1">
          <span className="font-semibold text-lg">{data.value}</span>
          <span className="ml-1">cases</span>
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{percentage}% of total</p>
      </div>
    );
  }
  return null;
};

export function RegionDistributionChart({ data }: RegionDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));
  const topRegion = data.length > 0 ? data.reduce((a, b) => a.value > b.value ? a : b) : null;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Cases by Region</CardTitle>
            <CardDescription className="text-xs">Geographic distribution (Top 8 regions)</CardDescription>
          </div>
          {topRegion && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Highest</p>
              <p className="font-semibold text-emerald-600">
                {topRegion.name.length > 15 ? topRegion.name.substring(0, 15) + '...' : topRegion.name}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={dataWithTotal}
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
              width={120}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748B' }}
              tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              animationDuration={800}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={REGION_COLORS[index % REGION_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Total summary */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>{data.length} regions displayed</span>
          <span className="font-medium text-slate-700">{total} total cases</span>
        </div>
      </CardContent>
    </Card>
  );
}

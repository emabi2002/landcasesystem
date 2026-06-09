'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; opened: number; closed: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-slate-900 mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-600">{item.name}:</span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Net: {payload[0].value - payload[1].value > 0 ? '+' : ''}{payload[0].value - payload[1].value}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  // Calculate totals for the summary
  const totalOpened = data.reduce((sum, item) => sum + item.opened, 0);
  const totalClosed = data.reduce((sum, item) => sum + item.closed, 0);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">12-Month Trend</CardTitle>
            <CardDescription className="text-xs">Cases opened vs closed over time</CardDescription>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-right">
              <p className="text-xs text-slate-500">Opened</p>
              <p className="font-semibold text-emerald-600">{totalOpened}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Closed</p>
              <p className="font-semibold text-blue-600">{totalClosed}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="openedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="closedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748B' }}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs text-slate-600">{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="opened"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#openedGradient)"
              name="Opened"
              dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#10B981', stroke: 'white', strokeWidth: 2 }}
              animationDuration={1000}
            />
            <Area
              type="monotone"
              dataKey="closed"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#closedGradient)"
              name="Closed"
              dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#3B82F6', stroke: 'white', strokeWidth: 2 }}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

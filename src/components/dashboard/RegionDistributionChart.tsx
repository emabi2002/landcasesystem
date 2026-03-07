'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RegionDistributionChartProps {
  data: Array<{ name: string; value: number }>;
}

export function RegionDistributionChart({ data }: RegionDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cases by Region</CardTitle>
        <CardDescription>Geographic distribution (Top 8 regions)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={180} />
            <Tooltip />
            <Bar dataKey="value" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

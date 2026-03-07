'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CaseAgeChartProps {
  data: Array<{ name: string; value: number }>;
}

export function CaseAgeChart({ data }: CaseAgeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Cases by Age</CardTitle>
        <CardDescription>How long open cases have been active</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#EF5A5A" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { format, subYears } from 'date-fns';

interface YearComparisonCardsProps {
  thisYear: number;
  lastYear: number;
}

export function YearComparisonCards({ thisYear, lastYear }: YearComparisonCardsProps) {
  const percentChange = lastYear > 0
    ? ((thisYear - lastYear) / lastYear * 100)
    : thisYear > 0 ? 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">This Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{thisYear}</div>
          <p className="text-xs text-slate-600 mt-1">Cases opened in {format(new Date(), 'yyyy')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Last Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-700">{lastYear}</div>
          <p className="text-xs text-slate-600 mt-1">Cases opened in {format(subYears(new Date(), 1), 'yyyy')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Year-over-Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            {thisYear >= lastYear ? (
              <>
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-green-600">
                  +{percentChange.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-2xl font-bold text-red-600">
                  {percentChange.toFixed(1)}%
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1">Compared to last year</p>
        </CardContent>
      </Card>
    </div>
  );
}

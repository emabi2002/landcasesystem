'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { CostAggregation, CategoryBreakdown } from '@/types/litigation-costs';

interface CostSummaryCardProps {
  caseId: string;
  compact?: boolean;
}

export function CostSummaryCard({ caseId, compact = false }: CostSummaryCardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CostAggregation | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);

  useEffect(() => {
    loadCostSummary();
  }, [caseId]);

  async function loadCostSummary() {
    setLoading(true);
    try {
      // Get total costs for this case
      const { data: costs, error } = await (supabase as any)
        .from('litigation_costs')
        .select('amount, amount_paid, payment_status')
        .eq('case_id', caseId)
        .eq('is_deleted', false);

      if (error) throw error;

      if (costs && costs.length > 0) {
        const total_amount = costs.reduce((sum: number, c: { amount?: number }) => sum + (c.amount || 0), 0);
        const total_paid = costs.reduce((sum: number, c: { amount_paid?: number }) => sum + (c.amount_paid || 0), 0);

        setSummary({
          total_amount,
          total_paid,
          total_outstanding: total_amount - total_paid,
          entry_count: costs.length,
        });
      } else {
        setSummary({
          total_amount: 0,
          total_paid: 0,
          total_outstanding: 0,
          entry_count: 0,
        });
      }

      // Get breakdown by category
      const { data: breakdownData, error: breakdownError } = await (supabase as any)
        .from('litigation_costs')
        .select(`
          amount,
          cost_type,
          cost_categories (
            name,
            category_group
          )
        `)
        .eq('case_id', caseId)
        .eq('is_deleted', false);

      if (!breakdownError && breakdownData) {
        // Aggregate by category
        const categoryMap = new Map<string, { amount: number; count: number; group: string }>();

        breakdownData.forEach((cost: { amount: number; cost_type: string; cost_categories: { name: string; category_group: string } | null }) => {
          const categoryName = cost.cost_categories?.name || cost.cost_type;
          const categoryGroup = cost.cost_categories?.category_group || 'Other';

          if (categoryMap.has(categoryName)) {
            const existing = categoryMap.get(categoryName)!;
            existing.amount += cost.amount || 0;
            existing.count += 1;
          } else {
            categoryMap.set(categoryName, {
              amount: cost.amount || 0,
              count: 1,
              group: categoryGroup,
            });
          }
        });

        const breakdownResult: CategoryBreakdown[] = [];
        categoryMap.forEach((value, key) => {
          breakdownResult.push({
            category_name: key,
            category_group: value.group,
            total_amount: value.amount,
            entry_count: value.count,
          });
        });

        // Sort by amount descending
        breakdownResult.sort((a, b) => b.total_amount - a.total_amount);
        setBreakdown(breakdownResult);
      }
    } catch (err) {
      console.error('Error loading cost summary:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-[#8B2332]/5 to-[#8B2332]/10 border-[#8B2332]/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#8B2332]" />
              <span className="text-sm font-medium text-gray-600">Total Costs</span>
            </div>
            <span className="text-lg font-bold text-[#8B2332]">
              {formatCurrency(summary?.total_amount || 0)}
            </span>
          </div>
          {summary && summary.total_outstanding > 0 && (
            <div className="mt-2 text-sm text-amber-600 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatCurrency(summary.total_outstanding)} outstanding
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-[#8B2332]" />
          Litigation Cost Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Total Costs</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(summary?.total_amount || 0)}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Paid
            </p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(summary?.total_paid || 0)}
            </p>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-600 mb-1 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Outstanding
            </p>
            <p className="text-xl font-bold text-amber-700">
              {formatCurrency(summary?.total_outstanding || 0)}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Cost Entries</p>
            <p className="text-xl font-bold text-blue-700">
              {summary?.entry_count || 0}
            </p>
          </div>
        </div>

        {/* Payment Progress */}
        {summary && summary.total_amount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Progress</span>
              <span className="font-medium">
                {Math.round((summary.total_paid / summary.total_amount) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(summary.total_paid / summary.total_amount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        {breakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Cost Breakdown</h4>
            <div className="space-y-2">
              {breakdown.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {cat.category_group}
                    </Badge>
                    <span className="text-sm text-gray-700">{cat.category_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(cat.total_amount)}</p>
                    <p className="text-xs text-gray-500">{cat.entry_count} entries</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No costs message */}
        {summary?.entry_count === 0 && (
          <div className="text-center py-6 text-gray-500">
            <DollarSign className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>No cost entries recorded yet</p>
            <p className="text-sm">Add cost entries to track litigation expenses</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

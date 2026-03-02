'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import Link from 'next/link';
import type { LitigationCostsStats } from './types';

interface LitigationCostsCardProps {
  litigationCosts: LitigationCostsStats;
  totalCases: number;
}

export function LitigationCostsCard({ litigationCosts, totalCases }: LitigationCostsCardProps) {
  return (
    <Card className="border-2 border-[#8B2332]/20 bg-gradient-to-br from-red-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#8B2332] rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Litigation Costs Overview</CardTitle>
            </div>
          </div>
          <Link href="/litigation-costs">
            <button className="px-4 py-2 text-sm bg-[#8B2332] text-white rounded-lg hover:bg-[#6B1A26] transition-colors">
              View Full Report
            </button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="p-4 bg-white rounded-lg border border-[#8B2332]/20">
            <div className="text-xs font-medium text-slate-600 mb-1">Total Costs</div>
            <div className="text-2xl font-bold text-[#8B2332]">
              K{(litigationCosts.totalAmount / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {litigationCosts.entryCount} entries
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Paid</div>
            <div className="text-2xl font-bold text-green-600">
              K{(litigationCosts.totalPaid / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-green-600 mt-1">
              {litigationCosts.totalAmount > 0
                ? ((litigationCosts.totalPaid / litigationCosts.totalAmount) * 100).toFixed(0)
                : 0}% of total
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-amber-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Outstanding</div>
            <div className="text-2xl font-bold text-amber-600">
              K{(litigationCosts.totalOutstanding / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-amber-600 mt-1">
              Pending payment
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Cases with Costs</div>
            <div className="text-2xl font-bold text-blue-600">
              {litigationCosts.caseCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              of {totalCases} total
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Avg Cost/Case</div>
            <div className="text-2xl font-bold text-purple-600">
              K{litigationCosts.caseCount > 0
                ? ((litigationCosts.totalAmount / litigationCosts.caseCount) / 1000).toFixed(0)
                : 0}k
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Per case average
            </div>
          </div>
        </div>
        {litigationCosts.entryCount === 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              No litigation costs recorded yet. Add costs from individual case pages.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

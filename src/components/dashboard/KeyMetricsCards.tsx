'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle, TrendingUp, TrendingDown, Clock,
  CheckCircle, FileText, Calendar, Bell
} from 'lucide-react';
import type { CaseStats } from './types';

interface KeyMetricsCardsProps {
  stats: CaseStats;
  pendingAlerts: number;
}

export function KeyMetricsCards({ stats, pendingAlerts }: KeyMetricsCardsProps) {
  const openPercentage = stats.total > 0 ? ((stats.open / stats.total) * 100) : 0;
  const closedPercentage = stats.total > 0 ? ((stats.closed / stats.total) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {/* Total Cases */}
      <Card className="relative overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white" />
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Cases</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
              <div className="mt-1 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
                <span className="text-emerald-600 font-medium">{stats.thisMonth} this month</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Cases */}
      <Card className="relative overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-white" />
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Open Cases</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-amber-600">{stats.open}</div>
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden w-16">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${openPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{openPercentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closed Cases */}
      <Card className="relative overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-white" />
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Closed Cases</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-600">{stats.closed}</div>
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden w-16">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${closedPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{closedPercentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="relative overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-white" />
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wide">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-600">{stats.upcomingEvents}</div>
              <div className="mt-1 flex items-center text-xs">
                {stats.overdueTasks > 0 ? (
                  <>
                    <Clock className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600 font-medium">{stats.overdueTasks} overdue tasks</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 text-emerald-500 mr-1" />
                    <span className="text-emerald-600 font-medium">All tasks on track</span>
                  </>
                )}
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Alerts */}
      <Card className={`relative overflow-hidden border-2 hover:shadow-md transition-shadow ${
        pendingAlerts > 0 ? 'border-red-200 animate-pulse' : 'border-slate-200'
      }`}>
        <div className={`absolute inset-0 ${
          pendingAlerts > 0 ? 'bg-gradient-to-br from-red-50 to-white' : 'bg-gradient-to-br from-slate-50 to-white'
        }`} />
        <CardHeader className="pb-2 relative">
          <CardTitle className={`text-xs font-medium uppercase tracking-wide flex items-center gap-1.5 ${
            pendingAlerts > 0 ? 'text-red-600' : 'text-slate-500'
          }`}>
            <Bell className="h-3 w-3" />
            Pending Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-3xl font-bold ${pendingAlerts > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {pendingAlerts}
              </div>
              <div className="mt-1 text-xs">
                {pendingAlerts > 0 ? (
                  <span className="text-red-600 font-medium">Requires attention</span>
                ) : (
                  <span className="text-emerald-600">All clear</span>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-xl ${pendingAlerts > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <AlertCircle className={`h-6 w-6 ${pendingAlerts > 0 ? 'text-red-600' : 'text-slate-400'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

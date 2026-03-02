'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle, TrendingUp, Clock,
  CheckCircle, FileText, Calendar, Bell
} from 'lucide-react';
import type { CaseStats } from './types';

interface KeyMetricsCardsProps {
  stats: CaseStats;
  pendingAlerts: number;
}

export function KeyMetricsCards({ stats, pendingAlerts }: KeyMetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Total Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">{stats.thisMonth} this month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Open Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-orange-600">{stats.open}</div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {stats.total > 0 ? ((stats.open / stats.total) * 100).toFixed(1) : 0}% of total
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Closed Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-green-600">{stats.closed}</div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {stats.total > 0 ? ((stats.closed / stats.total) * 100).toFixed(1) : 0}% of total
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-purple-600">{stats.upcomingEvents}</div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <Clock className="h-4 w-4 text-orange-600 mr-1" />
            <span className="text-orange-600">{stats.overdueTasks} overdue tasks</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Pending Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-red-600">{pendingAlerts}</div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div className="mt-2 text-sm text-red-600">
            {pendingAlerts > 0 ? 'Requires your attention' : 'No pending alerts'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

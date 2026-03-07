'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface AlertsNotificationCardProps {
  upcomingEvents: number;
  overdueTasks: number;
}

export function AlertsNotificationCard({ upcomingEvents, overdueTasks }: AlertsNotificationCardProps) {
  if (upcomingEvents === 0 && overdueTasks === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Alerts & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {upcomingEvents > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">
                {upcomingEvents} Upcoming Events
              </Badge>
              <span className="text-sm text-slate-600">in the next 30 days</span>
            </div>
          )}
          {overdueTasks > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">
                {overdueTasks} Overdue Tasks
              </Badge>
              <span className="text-sm text-slate-600">require immediate attention</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import type { WorkflowProgress } from './types';

interface WorkflowProgressCardProps {
  workflowProgress: WorkflowProgress;
}

export function WorkflowProgressCard({ workflowProgress }: WorkflowProgressCardProps) {
  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          Workflow Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Registered</div>
            <div className="text-2xl font-bold text-blue-600">{workflowProgress.registered}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Directions</div>
            <div className="text-2xl font-bold text-purple-600">{workflowProgress.directions}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-emerald-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Allocated</div>
            <div className="text-2xl font-bold text-emerald-600">{workflowProgress.allocated}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-orange-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Litigation</div>
            <div className="text-2xl font-bold text-orange-600">{workflowProgress.litigation}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-indigo-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Compliance</div>
            <div className="text-2xl font-bold text-indigo-600">{workflowProgress.compliance}</div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-red-200">
            <div className="text-xs font-medium text-slate-600 mb-1">Ready for Closure</div>
            <div className="text-2xl font-bold text-red-600">{workflowProgress.readyForClosure}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

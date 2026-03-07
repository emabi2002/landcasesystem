'use client';

import { Check, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
}

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const defaultSteps: WorkflowStep[] = [
  { id: 'registered', name: 'Registered', description: 'Case filed and logged', status: 'pending' },
  { id: 'assigned', name: 'Assigned', description: 'Officer assigned', status: 'pending' },
  { id: 'in_progress', name: 'In Progress', description: 'Active litigation', status: 'pending' },
  { id: 'directions', name: 'Directions', description: 'Court directions received', status: 'pending' },
  { id: 'hearing', name: 'Hearing', description: 'Court hearing scheduled', status: 'pending' },
  { id: 'judgment', name: 'Judgment', description: 'Court order issued', status: 'pending' },
  { id: 'compliance', name: 'Compliance', description: 'Order compliance tracked', status: 'pending' },
  { id: 'closed', name: 'Closed', description: 'Case archived', status: 'pending' },
];

export function getWorkflowStepsFromStatus(status: string, caseData?: any): WorkflowStep[] {
  const statusIndex: Record<string, number> = {
    'registered': 0,
    'under_review': 0,
    'assigned': 1,
    'in_progress': 2,
    'in_court': 3,
    'directions': 3,
    'hearing': 4,
    'mediation': 4,
    'tribunal': 4,
    'judgment': 5,
    'compliance': 6,
    'settled': 7,
    'closed': 7,
  };

  const currentIndex = statusIndex[status] ?? 0;

  return defaultSteps.map((step, index) => ({
    ...step,
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending',
    date: index <= currentIndex && caseData?.created_at
      ? new Date(caseData.created_at).toLocaleDateString()
      : undefined,
  }));
}

export function WorkflowStepper({
  steps,
  className,
  orientation = 'horizontal'
}: WorkflowStepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-4">
            {/* Step Indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  step.status === 'completed' && 'border-emerald-500 bg-emerald-500 text-white',
                  step.status === 'current' && 'border-blue-500 bg-blue-50 text-blue-600',
                  step.status === 'pending' && 'border-slate-300 bg-white text-slate-400'
                )}
              >
                {step.status === 'completed' ? (
                  <Check className="h-5 w-5" />
                ) : step.status === 'current' ? (
                  <Clock className="h-5 w-5 animate-pulse" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-8 mt-2',
                    step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2">
                <h4
                  className={cn(
                    'font-semibold',
                    step.status === 'completed' && 'text-emerald-700',
                    step.status === 'current' && 'text-blue-700',
                    step.status === 'pending' && 'text-slate-400'
                  )}
                >
                  {step.name}
                </h4>
                {step.date && (
                  <span className="text-xs text-slate-500">{step.date}</span>
                )}
              </div>
              <p
                className={cn(
                  'text-sm',
                  step.status === 'pending' ? 'text-slate-400' : 'text-slate-600'
                )}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="flex flex-1 items-center"
          >
            {/* Step Circle */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                  step.status === 'completed' && 'border-emerald-500 bg-emerald-500 text-white',
                  step.status === 'current' && 'border-blue-500 bg-blue-50 text-blue-600 ring-4 ring-blue-100',
                  step.status === 'pending' && 'border-slate-300 bg-white text-slate-400'
                )}
              >
                {step.status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'absolute -bottom-6 whitespace-nowrap text-xs font-medium',
                  step.status === 'completed' && 'text-emerald-600',
                  step.status === 'current' && 'text-blue-600',
                  step.status === 'pending' && 'text-slate-400'
                )}
              >
                {step.name}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  step.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { defaultSteps };

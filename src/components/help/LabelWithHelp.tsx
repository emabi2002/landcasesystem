'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { HelpTooltip } from './HelpTooltip';

interface LabelWithHelpProps {
  htmlFor?: string;
  className?: string;
  /** Short explanation shown in the question-mark tooltip. */
  help: React.ReactNode;
  /** Optional bold heading for the tooltip. */
  helpTitle?: string;
  children: React.ReactNode;
}

/**
 * A form label with a small "?" help icon beside it.
 * Keeps field guidance consistent across all forms.
 */
export function LabelWithHelp({
  htmlFor,
  className,
  help,
  helpTitle,
  children,
}: LabelWithHelpProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className={className}>
        {children}
      </Label>
      <HelpTooltip title={helpTitle} content={help} />
    </div>
  );
}

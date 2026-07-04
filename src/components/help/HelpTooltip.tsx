'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  /** The explanation shown when the icon is opened. */
  content: React.ReactNode;
  /** Optional bold heading above the content. */
  title?: string;
  /** Accessible label for the trigger. */
  label?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  iconClassName?: string;
}

/**
 * A small "?" icon that reveals a short explanation for a field or action.
 * Opens on hover (desktop) and on click/tap (all devices) for accessibility.
 */
export function HelpTooltip({
  content,
  title,
  label = 'More information',
  side = 'top',
  align = 'center',
  className,
  iconClassName,
}: HelpTooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title ? `Help: ${title}` : label}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-dlpp-purple focus:outline-none focus-visible:ring-2 focus-visible:ring-dlpp-purple/40',
            className,
          )}
        >
          <HelpCircle className={cn('h-4 w-4', iconClassName)} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-64 rounded-lg border-slate-200 p-3 text-sm shadow-lg"
      >
        {title && (
          <p className="mb-1 font-semibold text-slate-900">{title}</p>
        )}
        <div className="leading-relaxed text-slate-600">{content}</div>
      </PopoverContent>
    </Popover>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHelp } from './HelpProvider';

/** Routes where the floating help button should not appear. */
const HIDDEN_ROUTES = ['/login', '/'];

export function HelpButton() {
  const pathname = usePathname();
  const { openHelp, isOpen } = useHelp();

  if (pathname && HIDDEN_ROUTES.includes(pathname)) return null;

  return (
    <button
      type="button"
      data-tour="help-button"
      onClick={() => openHelp()}
      aria-label="Open help"
      className={cn(
        'group fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-dlpp-purple px-4 py-3 text-white shadow-lg shadow-dlpp-purple/30 transition-all duration-200',
        'hover:bg-dlpp-purple-dark hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-dlpp-purple focus-visible:ring-offset-2',
        isOpen && 'pointer-events-none scale-90 opacity-0',
      )}
    >
      <HelpCircle className="h-5 w-5" />
      <span className="hidden text-sm font-semibold sm:inline">Help</span>
      <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dlpp-gold opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-dlpp-gold" />
      </span>
    </button>
  );
}

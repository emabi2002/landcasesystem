'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Keyboard,
  Search,
  FolderOpen,
  CheckSquare,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  Home,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'global';
  icon?: React.ElementType;
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  // Define all shortcuts
  const shortcuts: Shortcut[] = [
    // Global shortcuts
    {
      keys: ['⌘', 'K'],
      description: 'Open search',
      action: () => {
        // Search is handled by GlobalSearch component
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
        document.dispatchEvent(event);
      },
      category: 'global',
      icon: Search,
    },
    {
      keys: ['?'],
      description: 'Show keyboard shortcuts',
      action: () => setHelpOpen(true),
      category: 'global',
      icon: Keyboard,
    },
    {
      keys: ['Esc'],
      description: 'Close dialogs/modals',
      action: () => {
        // Escape is handled natively
      },
      category: 'global',
    },

    // Navigation shortcuts
    {
      keys: ['G', 'H'],
      description: 'Go to Dashboard',
      action: () => router.push('/dashboard'),
      category: 'navigation',
      icon: Home,
    },
    {
      keys: ['G', 'C'],
      description: 'Go to Cases',
      action: () => router.push('/cases'),
      category: 'navigation',
      icon: FolderOpen,
    },
    {
      keys: ['G', 'T'],
      description: 'Go to Tasks',
      action: () => router.push('/tasks'),
      category: 'navigation',
      icon: CheckSquare,
    },
    {
      keys: ['G', 'D'],
      description: 'Go to Documents',
      action: () => router.push('/documents'),
      category: 'navigation',
      icon: FileText,
    },
    {
      keys: ['G', 'E'],
      description: 'Go to Calendar',
      action: () => router.push('/calendar'),
      category: 'navigation',
      icon: Calendar,
    },
    {
      keys: ['G', 'M'],
      description: 'Go to Communications',
      action: () => router.push('/communications'),
      category: 'navigation',
      icon: MessageSquare,
    },
    {
      keys: ['G', 'S'],
      description: 'Go to Settings',
      action: () => router.push('/settings'),
      category: 'navigation',
      icon: Settings,
    },

    // Action shortcuts
    {
      keys: ['N'],
      description: 'Create new (context-aware)',
      action: () => {
        if (pathname?.includes('/cases')) {
          router.push('/cases/new');
        } else if (pathname?.includes('/tasks')) {
          // Trigger new task dialog
        }
      },
      category: 'actions',
      icon: Plus,
    },
    {
      keys: ['R'],
      description: 'Refresh current page',
      action: () => router.refresh(),
      category: 'actions',
      icon: RefreshCw,
    },
  ];

  // Track key sequence for multi-key shortcuts
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [sequenceTimeout, setSequenceTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    // Handle ? for help
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      setHelpOpen(true);
      return;
    }

    // Handle escape
    if (e.key === 'Escape') {
      setHelpOpen(false);
      setKeySequence([]);
      return;
    }

    // Clear previous timeout
    if (sequenceTimeout) {
      clearTimeout(sequenceTimeout);
    }

    // Add key to sequence
    const key = e.key.toUpperCase();
    const newSequence = [...keySequence, key];
    setKeySequence(newSequence);

    // Set timeout to clear sequence
    const timeout = setTimeout(() => {
      setKeySequence([]);
    }, 1000);
    setSequenceTimeout(timeout);

    // Check for matching shortcuts
    for (const shortcut of shortcuts) {
      if (shortcut.category === 'global') continue; // Skip global shortcuts handled elsewhere

      const shortcutKeys = shortcut.keys.map(k => k.toUpperCase());

      // Check if current sequence matches shortcut
      if (shortcutKeys.length === newSequence.length) {
        const matches = shortcutKeys.every((k, i) => k === newSequence[i]);
        if (matches) {
          e.preventDefault();
          shortcut.action();
          setKeySequence([]);
          if (sequenceTimeout) clearTimeout(sequenceTimeout);
          return;
        }
      }
    }
  }, [keySequence, sequenceTimeout, router, pathname, shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeout) clearTimeout(sequenceTimeout);
    };
  }, [handleKeyDown, sequenceTimeout]);

  const groupedShortcuts = {
    global: shortcuts.filter(s => s.category === 'global'),
    navigation: shortcuts.filter(s => s.category === 'navigation'),
    actions: shortcuts.filter(s => s.category === 'actions'),
  };

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Global Shortcuts */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Global</Badge>
              Available anywhere
            </h4>
            <div className="grid gap-2">
              {groupedShortcuts.global.map((shortcut, index) => {
                const Icon = shortcut.icon;
                return (
                  <div key={index} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                      <span className="text-sm text-slate-700">{shortcut.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-600"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Navigation</Badge>
              Press G then a letter
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {groupedShortcuts.navigation.map((shortcut, index) => {
                const Icon = shortcut.icon;
                return (
                  <div key={index} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                      <span className="text-sm text-slate-700">{shortcut.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-600"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Shortcuts */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Actions</Badge>
              Quick actions
            </h4>
            <div className="grid gap-2">
              {groupedShortcuts.actions.map((shortcut, index) => {
                const Icon = shortcut.icon;
                return (
                  <div key={index} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                      <span className="text-sm text-slate-700">{shortcut.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-600"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-4 border-t">
          Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">?</kbd> anytime to show this help
        </div>
      </DialogContent>
    </Dialog>
  );
}

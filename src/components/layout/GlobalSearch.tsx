'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  FolderOpen,
  FileText,
  CheckSquare,
  MessageSquare,
  Calendar,
  Users,
  MapPin,
  Search,
  Clock,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  type: 'case' | 'task' | 'document' | 'communication' | 'event' | 'party' | 'parcel';
  title: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
  caseId?: string;
  caseNumber?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  case: FolderOpen,
  task: CheckSquare,
  document: FileText,
  communication: MessageSquare,
  event: Calendar,
  party: Users,
  parcel: MapPin,
};

const typeColors: Record<string, string> = {
  case: 'bg-emerald-100 text-emerald-800',
  task: 'bg-amber-100 text-amber-800',
  document: 'bg-purple-100 text-purple-800',
  communication: 'bg-cyan-100 text-cyan-800',
  event: 'bg-indigo-100 text-indigo-800',
  party: 'bg-pink-100 text-pink-800',
  parcel: 'bg-orange-100 text-orange-800',
};

const typeLabels: Record<string, string> = {
  case: 'Case',
  task: 'Task',
  document: 'Document',
  communication: 'Communication',
  event: 'Event',
  party: 'Party',
  parcel: 'Land Parcel',
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Register keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      const q = searchQuery.toLowerCase();

      // Search cases
      const { data: cases } = await supabase
        .from('cases')
        .select('id, case_number, title, status, created_at')
        .or(`case_number.ilike.%${q}%,title.ilike.%${q}%`)
        .limit(5);

      (cases as any[] | null)?.forEach((c: any) => {
        searchResults.push({
          id: c.id,
          type: 'case',
          title: c.title || c.case_number,
          subtitle: `${c.case_number} • ${c.status?.replace('_', ' ')}`,
          caseId: c.id,
          caseNumber: c.case_number,
        });
      });

      // Search tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, case_id, cases(case_number)')
        .or(`title.ilike.%${q}%`)
        .limit(5);

      (tasks as any[] | null)?.forEach((t: any) => {
        searchResults.push({
          id: t.id,
          type: 'task',
          title: t.title,
          subtitle: `${t.cases?.case_number || 'No case'} • Due: ${format(new Date(t.due_date), 'MMM dd')}`,
          caseId: t.case_id,
          caseNumber: t.cases?.case_number,
        });
      });

      // Search documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id, title, document_type, uploaded_at, case_id, cases(case_number)')
        .or(`title.ilike.%${q}%`)
        .limit(5);

      (documents as any[] | null)?.forEach((d: any) => {
        searchResults.push({
          id: d.id,
          type: 'document',
          title: d.title,
          subtitle: `${d.cases?.case_number || 'No case'} • ${d.document_type?.replace('_', ' ')}`,
          caseId: d.case_id,
          caseNumber: d.cases?.case_number,
        });
      });

      // Search communications
      const { data: communications } = await supabase
        .from('communications')
        .select('id, subject, direction, party_name, case_id, communication_date')
        .or(`subject.ilike.%${q}%,party_name.ilike.%${q}%`)
        .limit(5);

      (communications as any[] | null)?.forEach((c: any) => {
        searchResults.push({
          id: c.id,
          type: 'communication',
          title: c.subject,
          subtitle: `${c.direction} • ${c.party_name || 'Unknown party'}`,
          caseId: c.case_id,
        });
      });

      // Search events
      const { data: events } = await supabase
        .from('events')
        .select('id, title, event_type, event_date, location, case_id, cases(case_number)')
        .or(`title.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(5);

      (events as any[] | null)?.forEach((e: any) => {
        searchResults.push({
          id: e.id,
          type: 'event',
          title: e.title,
          subtitle: `${e.cases?.case_number || 'No case'} • ${format(new Date(e.event_date), 'MMM dd, yyyy')}`,
          caseId: e.case_id,
          caseNumber: e.cases?.case_number,
        });
      });

      // Search parties
      const { data: parties } = await supabase
        .from('parties')
        .select('id, name, party_type, role, case_id, cases(case_number)')
        .or(`name.ilike.%${q}%`)
        .limit(5);

      (parties as any[] | null)?.forEach((p: any) => {
        searchResults.push({
          id: p.id,
          type: 'party',
          title: p.name,
          subtitle: `${p.cases?.case_number || 'No case'} • ${p.party_type?.replace('_', ' ')} (${p.role})`,
          caseId: p.case_id,
          caseNumber: p.cases?.case_number,
        });
      });

      // Search land parcels
      const { data: parcels } = await supabase
        .from('land_parcels')
        .select('id, parcel_number, location, case_id, cases(case_number)')
        .or(`parcel_number.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(5);

      (parcels as any[] | null)?.forEach((p: any) => {
        searchResults.push({
          id: p.id,
          type: 'parcel',
          title: `Parcel ${p.parcel_number}`,
          subtitle: `${p.cases?.case_number || 'No case'} • ${p.location || 'No location'}`,
          caseId: p.case_id,
          caseNumber: p.cases?.case_number,
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    const updatedRecent = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recent_searches', JSON.stringify(updatedRecent));

    // Navigate based on type
    switch (result.type) {
      case 'case':
        router.push(`/cases/${result.id}`);
        break;
      case 'task':
      case 'document':
      case 'event':
      case 'party':
      case 'parcel':
        if (result.caseId) {
          const tab = result.type === 'task' ? 'tasks' :
                     result.type === 'document' ? 'documents' :
                     result.type === 'event' ? 'events' :
                     result.type === 'party' ? 'parties' :
                     result.type === 'parcel' ? 'land' : 'overview';
          router.push(`/cases/${result.caseId}?tab=${tab}`);
        }
        break;
      case 'communication':
        router.push('/communications');
        break;
    }

    setOpen(false);
    setQuery('');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded bg-white px-1.5 font-mono text-[10px] text-slate-400 border border-slate-200">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command palette dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search cases, tasks, documents, communications..."
              value={query}
              onValueChange={setQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            {!query && recentSearches.length > 0 && (
              <>
                <CommandGroup heading={
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  </div>
                }>
                  {recentSearches.map((result) => {
                    const Icon = typeIcons[result.type];
                    return (
                      <CommandItem
                        key={`recent-${result.id}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                      >
                        <div className={`p-1.5 rounded ${typeColors[result.type]}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {typeLabels[result.type]}
                        </Badge>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {!query && !recentSearches.length && (
              <CommandEmpty className="py-12 text-center">
                <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Start typing to search across all entities
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Cases, tasks, documents, communications, events, parties, and land parcels
                </p>
              </CommandEmpty>
            )}

            {query && results.length === 0 && !loading && (
              <CommandEmpty className="py-12 text-center">
                <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  No results found for "{query}"
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try a different search term
                </p>
              </CommandEmpty>
            )}

            {query && results.length > 0 && (
              <>
                {Object.entries(groupedResults).map(([type, items]) => {
                  const Icon = typeIcons[type];
                  return (
                    <CommandGroup
                      key={type}
                      heading={
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3 w-3" />
                          {typeLabels[type]}s ({items.length})
                        </span>
                      }
                    >
                      {items.map((result) => {
                        const ResultIcon = typeIcons[result.type];
                        return (
                          <CommandItem
                            key={result.id}
                            onSelect={() => handleSelect(result)}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                          >
                            <div className={`p-1.5 rounded ${typeColors[result.type]}`}>
                              <ResultIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                              )}
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  );
                })}
              </>
            )}

            {/* Quick actions */}
            {!query && (
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  onSelect={() => {
                    router.push('/cases/new');
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                >
                  <div className="p-1.5 rounded bg-emerald-100 text-emerald-800">
                    <FolderOpen className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm">Create New Case</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    router.push('/cases');
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                >
                  <div className="p-1.5 rounded bg-blue-100 text-blue-800">
                    <FolderOpen className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm">View All Cases</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    router.push('/tasks');
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                >
                  <div className="p-1.5 rounded bg-amber-100 text-amber-800">
                    <CheckSquare className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm">View All Tasks</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    router.push('/calendar');
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                >
                  <div className="p-1.5 rounded bg-indigo-100 text-indigo-800">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm">View Calendar</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>

          {/* Footer */}
          <div className="border-t px-3 py-2 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">esc</kbd>
                Close
              </span>
            </div>
            <span>{results.length} results</span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}

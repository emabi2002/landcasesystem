'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, FolderOpen, Calendar, MapPin, CheckSquare, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'case' | 'document' | 'event' | 'task' | 'land_parcel' | 'party';
  title: string;
  subtitle: string;
  href: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(searchTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    const searchTerm = `%${query}%`;
    const allResults: SearchResult[] = [];

    try {
      // Search cases
      const { data: cases } = await supabase
        .from('cases')
        .select('id, case_number, title, status')
        .or(`case_number.ilike.${searchTerm},title.ilike.${searchTerm}`)
        .limit(5);

      if (cases) {
        cases.forEach((c: {id: string; case_number: string; title: string | null}) => {
          allResults.push({
            id: c.id,
            type: 'case',
            title: c.case_number,
            subtitle: c.title || 'Untitled Case',
            href: `/cases/${c.id}`,
          });
        });
      }

      // Search documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id, title, description, case_id')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (documents) {
        documents.forEach((d: {id: string; title: string; description: string | null; case_id: string}) => {
          allResults.push({
            id: d.id,
            type: 'document',
            title: d.title,
            subtitle: d.description || 'No description',
            href: `/cases/${d.case_id}?tab=documents`,
          });
        });
      }

      // Search events
      const { data: events } = await supabase
        .from('events')
        .select('id, title, event_date, case_id')
        .or(`title.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .limit(5);

      if (events) {
        events.forEach((e: {id: string; title: string; event_date: string; case_id: string}) => {
          allResults.push({
            id: e.id,
            type: 'event',
            title: e.title,
            subtitle: new Date(e.event_date).toLocaleDateString(),
            href: `/cases/${e.case_id}?tab=events`,
          });
        });
      }

      // Search tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, description, case_id')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5);

      if (tasks) {
        tasks.forEach((t: {id: string; title: string; description: string | null; case_id: string}) => {
          allResults.push({
            id: t.id,
            type: 'task',
            title: t.title,
            subtitle: t.description || 'No description',
            href: `/cases/${t.case_id}?tab=tasks`,
          });
        });
      }

      // Search land parcels
      const { data: parcels } = await supabase
        .from('land_parcels')
        .select('id, parcel_number, location, case_id')
        .or(`parcel_number.ilike.${searchTerm},location.ilike.${searchTerm}`)
        .limit(5);

      if (parcels) {
        parcels.forEach((p: {id: string; parcel_number: string; location: string | null; case_id: string}) => {
          allResults.push({
            id: p.id,
            type: 'land_parcel',
            title: p.parcel_number,
            subtitle: p.location || 'No location',
            href: `/cases/${p.case_id}?tab=land`,
          });
        });
      }

      // Search parties
      const { data: parties } = await supabase
        .from('parties')
        .select('id, name, role, case_id')
        .ilike('name', searchTerm)
        .limit(5);

      if (parties) {
        parties.forEach((p: {id: string; name: string; role: string; case_id: string}) => {
          allResults.push({
            id: p.id,
            type: 'party',
            title: p.name,
            subtitle: p.role || 'No role',
            href: `/cases/${p.case_id}?tab=parties`,
          });
        });
      }

      setResults(allResults);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'case':
        return <FolderOpen className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'land_parcel':
        return <MapPin className="h-4 w-4" />;
      case 'party':
        return <Users className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'case':
        return 'Case';
      case 'document':
        return 'Document';
      case 'event':
        return 'Event';
      case 'task':
        return 'Task';
      case 'land_parcel':
        return 'Land Parcel';
      case 'party':
        return 'Party';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.href);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search cases, documents, events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-slate-500 px-2 py-1">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </div>
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-start gap-3 p-2 hover:bg-slate-50 rounded text-left transition-colors"
              >
                <div className="mt-1 text-slate-400">{getIcon(result.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{result.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 truncate">{result.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border p-4 z-50">
          <div className="text-center text-slate-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No results found for &quot;{query}&quot;</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border p-4 z-50">
          <div className="text-center text-slate-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800 mx-auto"></div>
            <p className="text-sm mt-2">Searching...</p>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, FileText, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Case {
  id: string;
  case_number: string;
  title: string | null;
  status: string;
}

interface CaseSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export function CaseSelector({
  value,
  onValueChange,
  label = 'Case ID',
  placeholder = 'Search and select case...',
  required = false,
}: CaseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCases();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title, status')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCase = cases.find((c) => c.id === value);

  const filteredCases = cases.filter((c) =>
    c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (caseId: string) => {
    console.log('Selecting case:', caseId);
    onValueChange(caseId);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      {label && (
        <Label htmlFor="case-selector">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Button
          id="case-selector"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          onClick={() => setOpen(!open)}
        >
          {selectedCase ? (
            <span className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{selectedCase.case_number} - {selectedCase.title || 'Untitled'}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1">
            {selectedCase && (
              <X
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by case number or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading cases...
                </div>
              ) : filteredCases.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No cases found.
                </div>
              ) : (
                filteredCases.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-2 rounded-sm cursor-pointer hover:bg-accent',
                      value === c.id && 'bg-accent'
                    )}
                    onClick={() => handleSelect(c.id)}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        value === c.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm">{c.case_number}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {c.title || 'Untitled'} • {c.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Select from existing cases or search by case number
      </p>
    </div>
  );
}

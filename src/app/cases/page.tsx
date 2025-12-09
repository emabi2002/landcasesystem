'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

/** ---- Strong Types (no `any`) ---- */
type CaseStatus =
  | 'under_review'
  | 'in_court'
  | 'mediation'
  | 'tribunal'
  | 'judgment'
  | 'closed'
  | 'settled'
  | string;

type CaseType =
  | 'dispute'
  | 'court_matter'
  | 'title_claim'
  | 'administrative_review'
  | 'other'
  | string;

type CasePriority = 'low' | 'medium' | 'high' | 'urgent' | string;

interface Party {
  id: string;
  name: string;
  role: string;
  party_type: string;
}

interface CaseRow {
  id: string;
  case_number: string;
  title: string | null;
  description?: string | null;
  status: CaseStatus;
  case_type: CaseType;
  priority?: CasePriority | null;
  region?: string | null;
  created_at: string; // ISO string from Supabase
  parties?: Party[]; // Normalized party data
  plaintiffs?: string; // From cases_with_parties view
  defendants?: string; // From cases_with_parties view
}

type StatusFilter = 'all' | CaseStatus;
type TypeFilter = 'all' | CaseType;

export default function CasesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [partySearch, setPartySearch] = useState<string>(''); // NEW: Party search
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    void checkAuth();
    void loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, partySearch, statusFilter, typeFilter, cases]);

  const checkAuth = async (): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadCases = async (): Promise<void> => {
    try {
      // Use the normalized view that includes party data
      const { data, error } = await supabase
        .from('cases_with_parties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases((data as CaseRow[]) ?? []);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCases = (): void => {
    let filtered: CaseRow[] = [...cases];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => {
        const title = (c.title ?? '').toLowerCase();
        const number = (c.case_number ?? '').toLowerCase();
        const desc = (c.description ?? '').toLowerCase();
        return title.includes(q) || number.includes(q) || desc.includes(q);
      });
    }

    // NEW: Party search filter
    if (partySearch) {
      const q = partySearch.toLowerCase();
      filtered = filtered.filter((c) => {
        const plaintiffs = (c.plaintiffs ?? '').toLowerCase();
        const defendants = (c.defendants ?? '').toLowerCase();
        return plaintiffs.includes(q) || defendants.includes(q);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((c) => c.case_type === typeFilter);
    }

    setFilteredCases(filtered);
  };

  const getStatusBadge = (
    status: CaseStatus
  ): { className: string; label: string } => {
    const variants: Record<string, { className: string; label: string }> = {
      under_review: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Under Review',
      },
      in_court: {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'In Court',
      },
      mediation: {
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        label: 'Mediation',
      },
      tribunal: {
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        label: 'Tribunal',
      },
      judgment: {
        className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        label: 'Judgment',
      },
      closed: {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Closed',
      },
      settled: {
        className: 'bg-green-100 text-green-800 border-green-200',
        label: 'Settled',
      },
    };
    return variants[status] || { className: 'bg-gray-100 text-gray-800', label: status };
  };

  const getPriorityBadge = (
    priority?: CasePriority | null
  ): { className: string; label: string } => {
    const variants: Record<string, { className: string; label: string }> = {
      low: { className: 'bg-slate-100 text-slate-700', label: 'Low' },
      medium: { className: 'bg-blue-100 text-blue-700', label: 'Medium' },
      high: { className: 'bg-orange-100 text-orange-700', label: 'High' },
      urgent: { className: 'bg-red-100 text-red-700', label: 'Urgent' },
    };
    if (!priority) return { className: 'bg-gray-100 text-gray-700', label: '—' };
    return variants[priority] || { className: 'bg-gray-100 text-gray-700', label: priority };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading cases...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Cases</h1>
            <p className="text-slate-600 mt-1">Manage all legal cases</p>
          </div>
          <Link href="/cases/new">
            <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
              <Plus className="h-4 w-4" />
              Register New Case
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search cases by title, number, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="in_court">In Court</SelectItem>
                  <SelectItem value="mediation">Mediation</SelectItem>
                  <SelectItem value="tribunal">Tribunal</SelectItem>
                  <SelectItem value="judgment">Judgment</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as TypeFilter)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dispute">Dispute</SelectItem>
                  <SelectItem value="court_matter">Court Matter</SelectItem>
                  <SelectItem value="title_claim">Title Claim</SelectItem>
                  <SelectItem value="administrative_review">Administrative Review</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <div className="space-y-4">
          {filteredCases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-slate-400 mb-4">
                  <Filter className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No cases found</h3>
                <p className="text-slate-600 mb-6">
                  {cases.length === 0
                    ? 'Get started by registering your first case'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {cases.length === 0 && (
                  <Link href="/cases/new">
                    <Button className="gap-2 text-white hover:opacity-90" style={{ background: '#EF5A5A' }}>
                      <Plus className="h-4 w-4" />
                      Register First Case
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredCases.map((caseItem: CaseRow) => (
              <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <Link href={`/cases/${caseItem.id}`}>
                            <h3 className="text-lg font-semibold hover:text-blue-600 transition-colors cursor-pointer">
                              {caseItem.title ?? 'Untitled Case'}
                            </h3>
                          </Link>
                          <p className="text-sm text-slate-600 mt-1 font-mono">
                            {caseItem.case_number}
                          </p>
                          {caseItem.description && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              {caseItem.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                            <span>
                              Created: {format(new Date(caseItem.created_at), 'MMM dd, yyyy')}
                            </span>
                            {caseItem.region && <span>Region: {caseItem.region}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Badge className={getStatusBadge(caseItem.status).className}>
                        {getStatusBadge(caseItem.status).label}
                      </Badge>
                      {caseItem.priority && (
                        <Badge
                          variant="outline"
                          className={getPriorityBadge(caseItem.priority).className}
                        >
                          {getPriorityBadge(caseItem.priority).label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results Count */}
        {filteredCases.length > 0 && (
          <p className="text-sm text-slate-600 text-center">
            Showing {filteredCases.length} of {cases.length} cases
          </p>
        )}
      </div>
    </div>
  );
}

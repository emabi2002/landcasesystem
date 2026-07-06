'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import {
  generateCaseSummaryReport,
  generateStatisticsReport,
  generateTaskReport,
  generateDocumentRegister,
  generateLandParcelsReport,
  generateSearchWarrantRegister,
} from '@/lib/report-utils';
import { toast } from 'sonner';
import {
  FileText,
  BarChart3,
  FileSpreadsheet,
  FileImage,
  MapPin,
  CheckSquare,
  Printer,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { format as formatDate } from 'date-fns';

const REPORT_TYPES = [
  {
    id: 'case-summary',
    title: 'Case Summary Report',
    description: 'Complete list of all cases with details',
    icon: FileText,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    id: 'statistics',
    title: 'Case Statistics',
    description: 'Statistical analysis by status, type, region',
    icon: BarChart3,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    id: 'tasks',
    title: 'Task Status Report',
    description: 'Overview of all tasks and their status',
    icon: CheckSquare,
    color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    id: 'documents',
    title: 'Document Register',
    description: 'Complete document catalog',
    icon: FileSpreadsheet,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    id: 'land-parcels',
    title: 'Land Parcels Report',
    description: 'Land parcels and associated cases',
    icon: MapPin,
    color: 'bg-red-50 text-red-600 border-red-200',
  },
  {
    id: 'search-warrants',
    title: 'Search Warrant Register',
    description: 'Full warrant register with all official columns',
    icon: ShieldAlert,
    color: 'bg-violet-50 text-violet-600 border-violet-200',
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [region, setRegion] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<unknown[] | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${selectedReport}-${formatDate(new Date(), 'yyyy-MM-dd')}`,
  });

  const generateReport = async (exportFormat: 'excel' | 'pdf' | 'print') => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }

    setGenerating(true);

    try {
      switch (selectedReport) {
        case 'case-summary': {
          let query = supabase.from('cases').select('*');

          if (dateFrom) query = query.gte('created_at', dateFrom);
          if (dateTo) query = query.lte('created_at', dateTo);
          if (status !== 'all') query = query.eq('status', status);
          if (region !== 'all') query = query.eq('region', region);

          const { data, error } = await query;
          if (error) throw error;

          if (exportFormat === 'print') {
            setPreviewData(data);
            setTimeout(handlePrint, 500);
          } else {
            await generateCaseSummaryReport(data || [], exportFormat);
            toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
          }
          break;
        }

        case 'statistics': {
          const { data: cases, error } = await supabase.from('cases').select('*');
          if (error) throw error;

          const stats = {
            totalCases: cases?.length || 0,
            byStatus: {} as Record<string, number>,
            byType: {} as Record<string, number>,
            byRegion: {} as Record<string, number>,
            byPriority: {} as Record<string, number>,
          };

          cases?.forEach((c: { status: string; case_type: string; region: string; priority: string }) => {
            stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;
            stats.byType[c.case_type] = (stats.byType[c.case_type] || 0) + 1;
            stats.byRegion[c.region] = (stats.byRegion[c.region] || 0) + 1;
            stats.byPriority[c.priority] = (stats.byPriority[c.priority] || 0) + 1;
          });

          if (exportFormat === 'print') {
            setPreviewData([stats]);
            setTimeout(handlePrint, 500);
          } else {
            await generateStatisticsReport(stats, exportFormat);
            toast.success(`Statistics report exported as ${exportFormat.toUpperCase()}`);
          }
          break;
        }

        case 'tasks': {
          const { data, error } = await supabase
            .from('tasks')
            .select('*, cases(case_number)')
            .order('due_date', { ascending: true });
          if (error) throw error;

          const tasksWithCaseNumber = data?.map((t: { cases: { case_number: string } }) => ({
            ...t,
            case_number: t.cases?.case_number,
          }));

          if (exportFormat === 'print') {
            setPreviewData(tasksWithCaseNumber);
            setTimeout(handlePrint, 500);
          } else {
            await generateTaskReport(tasksWithCaseNumber || [], exportFormat);
            toast.success(`Task report exported as ${exportFormat.toUpperCase()}`);
          }
          break;
        }

        case 'documents': {
          const { data, error } = await supabase
            .from('documents')
            .select('*, cases(case_number)')
            .order('uploaded_at', { ascending: false });
          if (error) throw error;

          const docsWithCaseNumber = data?.map((d: { cases: { case_number: string } }) => ({
            ...d,
            case_number: d.cases?.case_number,
          }));

          if (exportFormat === 'print') {
            setPreviewData(docsWithCaseNumber);
            setTimeout(handlePrint, 500);
          } else {
            await generateDocumentRegister(docsWithCaseNumber || [], exportFormat);
            toast.success(`Document register exported as ${exportFormat.toUpperCase()}`);
          }
          break;
        }

        case 'land-parcels': {
          const { data, error } = await supabase
            .from('land_parcels')
            .select('*, cases(case_number)')
            .order('parcel_number', { ascending: true });
          if (error) throw error;

          const parcelsWithCaseNumber = data?.map((p: { cases: { case_number: string } }) => ({
            ...p,
            case_number: p.cases?.case_number,
          }));

          if (exportFormat === 'print') {
            setPreviewData(parcelsWithCaseNumber);
            setTimeout(handlePrint, 500);
          } else {
            await generateLandParcelsReport(parcelsWithCaseNumber || [], exportFormat);
            toast.success(`Land parcels report exported as ${exportFormat.toUpperCase()}`);
          }
          break;
        }

        case 'search-warrants': {
          let query = supabase
            .from('search_warrants')
            .select('*')
            .order('date_received', { ascending: false });

          if (dateFrom) query = query.gte('date_received', dateFrom);
          if (dateTo) query = query.lte('date_received', dateTo);

          const { data, error } = await query;
          if (error) {
            if ((error as { message?: string }).message?.includes('does not exist') || (error as { code?: string }).code === '42P01') {
              toast.error('Search warrants table not found. Run database-search-warrants.sql in Supabase first.');
              break;
            }
            throw error;
          }

          if (exportFormat === 'print') {
            setPreviewData(data);
            setTimeout(handlePrint, 500);
          } else {
            await generateSearchWarrantRegister(data || [], exportFormat);
            toast.success(`Search warrant register exported as ${exportFormat.toUpperCase()}`);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-5 w-5 text-slate-600" />
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Reports & Analytics</h1>
                <p className="text-xs text-slate-500">Generate and export case reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Report Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Select Report Type</h2>
                </div>
                <div className="p-4 space-y-2">
                  {REPORT_TYPES.map((report) => {
                    const Icon = report.icon;
                    return (
                      <button
                        key={report.id}
                        onClick={() => setSelectedReport(report.id)}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          selectedReport === report.id
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg border ${report.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm text-slate-900">{report.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{report.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filters and Export */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Report Filters</h2>
                  <p className="text-xs text-slate-500 mt-1">Customize your report parameters</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">Date From</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">Date To</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>

                  {selectedReport === 'case-summary' && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="settled">Settled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-600">Region</Label>
                        <Select value={region} onValueChange={setRegion}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            <SelectItem value="NCD">NCD</SelectItem>
                            <SelectItem value="Madang Province">Madang Province</SelectItem>
                            <SelectItem value="Eastern Highlands">Eastern Highlands</SelectItem>
                            <SelectItem value="Western Province">Western Province</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Export Report</h2>
                  <p className="text-xs text-slate-500 mt-1">Choose your export format</p>
                </div>
                <div className="p-6">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Button
                      onClick={() => generateReport('excel')}
                      disabled={!selectedReport || generating}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white h-10"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      {generating ? 'Generating...' : 'Export to Excel'}
                    </Button>
                    <Button
                      onClick={() => generateReport('pdf')}
                      disabled={!selectedReport || generating}
                      className="gap-2 bg-red-600 hover:bg-red-700 text-white h-10"
                    >
                      <FileImage className="h-4 w-4" />
                      {generating ? 'Generating...' : 'Export to PDF'}
                    </Button>
                    <Button
                      onClick={() => generateReport('print')}
                      disabled={!selectedReport || generating}
                      variant="outline"
                      className="gap-2 h-10"
                    >
                      <Printer className="h-4 w-4" />
                      Print Report
                    </Button>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 text-sm mb-2">Report Format Information</h3>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li><strong>Excel:</strong> Full data export with formulas and multiple sheets</li>
                      <li><strong>PDF:</strong> Print-ready formatted document with DLPP branding</li>
                      <li><strong>Print:</strong> Direct browser printing with optimized layout</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Preview */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {REPORT_TYPES.find(r => r.id === selectedReport)?.title}
            </h1>
            <p className="text-sm text-gray-600">
              Generated: {formatDate(new Date(), 'PPpp')}
            </p>
            <p className="text-sm text-gray-600">
              Department of Lands & Physical Planning
            </p>
          </div>
          {previewData && (
            <div>
              <pre className="text-xs">{JSON.stringify(previewData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  Building,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns';
import {
  LitigationCost,
  CaseCostSummary,
  PAYMENT_STATUS_OPTIONS,
  CostCategory
} from '@/types/litigation-costs';
import { CostAlertSettings } from '@/components/costs/CostAlertSettings';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface CostWithCase extends LitigationCost {
  cases?: {
    case_number: string;
    title: string;
    case_type: string;
    status: string;
  };
}

interface MonthlySummary {
  month: string;
  total: number;
  paid: number;
  outstanding: number;
}

interface CategorySummary {
  name: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS = [
  '#8B2332', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
];

export default function LitigationCostsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState<CostWithCase[]>([]);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [caseSummaries, setCaseSummaries] = useState<CaseCostSummary[]>([]);

  // Filters
  const [dateFrom, setDateFrom] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfYear(new Date()), 'yyyy-MM-dd'));
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregated data
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [totals, setTotals] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    entryCount: 0,
    caseCount: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [dateFrom, dateTo, caseTypeFilter, statusFilter]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }

  async function loadData() {
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('cost_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesData) setCategories(categoriesData);

      // Load costs with filters
      let query = supabase
        .from('litigation_costs')
        .select(`
          *,
          cases (
            case_number,
            title,
            case_type,
            status
          ),
          cost_categories (
            name,
            category_group
          )
        `)
        .eq('is_deleted', false)
        .gte('date_incurred', dateFrom)
        .lte('date_incurred', dateTo)
        .order('date_incurred', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter);
      }

      const { data: costsData, error } = await query;

      if (error) throw error;

      // Filter by case type if needed
      let filteredCosts = costsData || [];
      if (caseTypeFilter !== 'all') {
        filteredCosts = filteredCosts.filter(
          (c: CostWithCase) => c.cases?.case_type === caseTypeFilter
        );
      }

      setCosts(filteredCosts);

      // Calculate totals
      const totalAmount = filteredCosts.reduce((sum: number, c: CostWithCase) => sum + (c.amount || 0), 0);
      const totalPaid = filteredCosts.reduce((sum: number, c: CostWithCase) => sum + (c.amount_paid || 0), 0);
      const uniqueCases = new Set(filteredCosts.map((c: CostWithCase) => c.case_id));

      setTotals({
        totalAmount,
        totalPaid,
        totalOutstanding: totalAmount - totalPaid,
        entryCount: filteredCosts.length,
        caseCount: uniqueCases.size,
      });

      // Calculate monthly summary
      const monthlyMap = new Map<string, MonthlySummary>();
      filteredCosts.forEach((cost: CostWithCase) => {
        const month = format(new Date(cost.date_incurred), 'MMM yyyy');
        const existing = monthlyMap.get(month) || { month, total: 0, paid: 0, outstanding: 0 };
        existing.total += cost.amount || 0;
        existing.paid += cost.amount_paid || 0;
        existing.outstanding = existing.total - existing.paid;
        monthlyMap.set(month, existing);
      });
      setMonthlySummary(Array.from(monthlyMap.values()).reverse());

      // Calculate category summary
      const categoryMap = new Map<string, number>();
      filteredCosts.forEach((cost: CostWithCase) => {
        const categoryName = (cost as CostWithCase & { cost_categories?: { name: string } }).cost_categories?.name || cost.cost_type;
        const existing = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, existing + (cost.amount || 0));
      });

      const categorySummaryData: CategorySummary[] = [];
      let colorIndex = 0;
      categoryMap.forEach((value, name) => {
        categorySummaryData.push({
          name,
          value,
          color: CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length],
        });
        colorIndex++;
      });
      categorySummaryData.sort((a, b) => b.value - a.value);
      setCategorySummary(categorySummaryData);

      // Load case summaries for the table
      const caseSummaryMap = new Map<string, CaseCostSummary>();
      filteredCosts.forEach((cost: CostWithCase) => {
        const caseId = cost.case_id;
        const existing = caseSummaryMap.get(caseId);

        if (existing) {
          existing.total_cost_entries += 1;
          existing.total_amount += cost.amount || 0;
          existing.total_paid += cost.amount_paid || 0;
          existing.total_outstanding = existing.total_amount - existing.total_paid;
          if (cost.payment_status === 'paid') existing.paid_entries += 1;
          if (cost.payment_status === 'unpaid') existing.unpaid_entries += 1;
        } else {
          caseSummaryMap.set(caseId, {
            case_id: caseId,
            case_number: cost.cases?.case_number || 'N/A',
            case_title: cost.cases?.title || 'N/A',
            case_status: cost.cases?.status || 'N/A',
            case_type: cost.cases?.case_type || 'N/A',
            total_cost_entries: 1,
            total_amount: cost.amount || 0,
            total_paid: cost.amount_paid || 0,
            total_outstanding: (cost.amount || 0) - (cost.amount_paid || 0),
            paid_entries: cost.payment_status === 'paid' ? 1 : 0,
            unpaid_entries: cost.payment_status === 'unpaid' ? 1 : 0,
            first_cost_date: cost.date_incurred,
            last_cost_date: cost.date_incurred,
          });
        }
      });

      const summaries = Array.from(caseSummaryMap.values());
      summaries.sort((a, b) => b.total_amount - a.total_amount);
      setCaseSummaries(summaries);

    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load litigation costs data');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const exportToExcel = async () => {
    try {
      const xlsx = await import('xlsx');

      // Prepare data for export
      const exportData = costs.map(cost => ({
        'Case Number': cost.cases?.case_number || 'N/A',
        'Case Title': cost.cases?.title || 'N/A',
        'Cost Type': cost.cost_type,
        'Amount (PGK)': cost.amount,
        'Amount Paid (PGK)': cost.amount_paid,
        'Outstanding (PGK)': cost.amount - cost.amount_paid,
        'Date Incurred': format(new Date(cost.date_incurred), 'dd/MM/yyyy'),
        'Date Paid': cost.date_paid ? format(new Date(cost.date_paid), 'dd/MM/yyyy') : '',
        'Payment Status': cost.payment_status,
        'Payee': cost.payee_name || '',
        'Reference': cost.reference_number || '',
        'Responsible Unit': cost.responsible_unit || '',
        'Responsible Authority': cost.responsible_authority || '',
        'Description': cost.description || '',
      }));

      // Create summary sheet
      const summaryData = [
        { 'Metric': 'Report Period', 'Value': `${format(new Date(dateFrom), 'dd/MM/yyyy')} - ${format(new Date(dateTo), 'dd/MM/yyyy')}` },
        { 'Metric': 'Total Costs', 'Value': formatCurrency(totals.totalAmount) },
        { 'Metric': 'Total Paid', 'Value': formatCurrency(totals.totalPaid) },
        { 'Metric': 'Total Outstanding', 'Value': formatCurrency(totals.totalOutstanding) },
        { 'Metric': 'Number of Entries', 'Value': totals.entryCount },
        { 'Metric': 'Number of Cases', 'Value': totals.caseCount },
      ];

      // Create workbook with multiple sheets
      const wb = xlsx.utils.book_new();

      const summaryWs = xlsx.utils.json_to_sheet(summaryData);
      xlsx.utils.book_append_sheet(wb, summaryWs, 'Summary');

      const detailsWs = xlsx.utils.json_to_sheet(exportData);
      xlsx.utils.book_append_sheet(wb, detailsWs, 'Cost Details');

      // Case summary sheet
      const caseSummaryExport = caseSummaries.map(cs => ({
        'Case Number': cs.case_number,
        'Case Title': cs.case_title,
        'Case Type': cs.case_type,
        'Status': cs.case_status,
        'Total Costs (PGK)': cs.total_amount,
        'Paid (PGK)': cs.total_paid,
        'Outstanding (PGK)': cs.total_outstanding,
        'Cost Entries': cs.total_cost_entries,
      }));
      const caseWs = xlsx.utils.json_to_sheet(caseSummaryExport);
      xlsx.utils.book_append_sheet(wb, caseWs, 'By Case');

      // Download
      const filename = `Litigation_Costs_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      xlsx.writeFile(wb, filename);
      toast.success('Report exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report');
    }
  };

  const exportToPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(139, 35, 50); // DLPP color
      doc.text('LITIGATION COSTS REPORT', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Department of Lands & Physical Planning', pageWidth / 2, 22, { align: 'center' });
      doc.text(`Report Period: ${format(new Date(dateFrom), 'dd/MM/yyyy')} - ${format(new Date(dateTo), 'dd/MM/yyyy')}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, 34, { align: 'center' });

      // Summary Box
      doc.setDrawColor(139, 35, 50);
      doc.setLineWidth(0.5);
      doc.rect(14, 40, pageWidth - 28, 25);

      doc.setFontSize(11);
      doc.setTextColor(0);
      const summaryY = 50;
      const colWidth = (pageWidth - 28) / 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Total Costs', 20, summaryY);
      doc.text('Total Paid', 20 + colWidth, summaryY);
      doc.text('Outstanding', 20 + colWidth * 2, summaryY);
      doc.text('Cost Entries', 20 + colWidth * 3, summaryY);
      doc.text('Cases', 20 + colWidth * 4, summaryY);

      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(totals.totalAmount), 20, summaryY + 8);
      doc.text(formatCurrency(totals.totalPaid), 20 + colWidth, summaryY + 8);
      doc.text(formatCurrency(totals.totalOutstanding), 20 + colWidth * 2, summaryY + 8);
      doc.text(String(totals.entryCount), 20 + colWidth * 3, summaryY + 8);
      doc.text(String(totals.caseCount), 20 + colWidth * 4, summaryY + 8);

      // Case Summary Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cost Summary by Case', 14, 75);

      const tableData = caseSummaries.slice(0, 20).map(cs => [
        cs.case_number,
        cs.case_title?.substring(0, 30) + (cs.case_title && cs.case_title.length > 30 ? '...' : ''),
        cs.case_type?.replace(/_/g, ' '),
        formatCurrency(cs.total_amount),
        formatCurrency(cs.total_paid),
        formatCurrency(cs.total_outstanding),
        String(cs.total_cost_entries),
      ]);

      (autoTable as any)(doc, {
        startY: 80,
        head: [['Case #', 'Title', 'Type', 'Total Costs', 'Paid', 'Outstanding', 'Entries']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [139, 35, 50],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' },
          6: { cellWidth: 20, halign: 'center' },
        },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount} | DLPP Legal Case Management System | Confidential`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      const filename = `Litigation_Costs_Report_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(filename);
      toast.success('PDF report generated successfully');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF report');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      waived: 'bg-gray-100 text-gray-800',
      disputed: 'bg-orange-100 text-orange-800',
    };
    return <Badge className={colors[status] || colors.unpaid}>{status}</Badge>;
  };

  // Filter costs for the table
  const filteredCosts = costs.filter(cost => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cost.cases?.case_number?.toLowerCase().includes(query) ||
      cost.cases?.title?.toLowerCase().includes(query) ||
      cost.cost_type?.toLowerCase().includes(query) ||
      cost.payee_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="h-7 w-7 text-[#8B2332]" />
                Litigation Costs
              </h1>
              <p className="text-slate-600 mt-1">
                Financial cost tracking and analysis for all litigation matters
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <CostAlertSettings />
              <Button onClick={exportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button onClick={exportToPDF} className="bg-[#8B2332] hover:bg-[#6B1A26]">
                <FileText className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Case Type</Label>
                <Select value={caseTypeFilter} onValueChange={setCaseTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="land_title">Land Title</SelectItem>
                    <SelectItem value="boundary">Boundary Dispute</SelectItem>
                    <SelectItem value="lease">Lease Dispute</SelectItem>
                    <SelectItem value="compensation">Compensation</SelectItem>
                    <SelectItem value="customary_land">Customary Land</SelectItem>
                    <SelectItem value="judicial_review">Judicial Review</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {PAYMENT_STATUS_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Case, payee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#8B2332]" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-[#8B2332] to-[#6B1A26] text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Total Costs</p>
                      <p className="text-2xl font-bold">{formatCurrency(totals.totalAmount)}</p>
                    </div>
                    <DollarSign className="h-10 w-10 opacity-30" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600">Paid</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.totalPaid)}</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-300" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600">Outstanding</p>
                      <p className="text-2xl font-bold text-amber-700">{formatCurrency(totals.totalOutstanding)}</p>
                    </div>
                    <Clock className="h-10 w-10 text-amber-300" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cost Entries</p>
                      <p className="text-2xl font-bold">{totals.entryCount}</p>
                    </div>
                    <FileText className="h-10 w-10 text-gray-300" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cases with Costs</p>
                      <p className="text-2xl font-bold">{totals.caseCount}</p>
                    </div>
                    <Building className="h-10 w-10 text-gray-300" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Monthly Cost Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlySummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlySummary}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `K${(value / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Legend />
                        <Bar dataKey="total" name="Total" fill="#8B2332" />
                        <Bar dataKey="paid" name="Paid" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No data available for the selected period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Cost by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categorySummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RePieChart>
                        <Pie
                          data={categorySummary as unknown as Record<string, unknown>[]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${(name || '').slice(0, 15)}${(name || '').length > 15 ? '...' : ''} (${((percent || 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {categorySummary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No data available for the selected period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs defaultValue="by-case" className="space-y-4">
              <TabsList>
                <TabsTrigger value="by-case">By Case</TabsTrigger>
                <TabsTrigger value="all-entries">All Entries</TabsTrigger>
              </TabsList>

              {/* By Case Tab */}
              <TabsContent value="by-case">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost Summary by Case</CardTitle>
                    <CardDescription>
                      Cases ranked by total litigation costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {caseSummaries.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead>Case</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Total Costs</TableHead>
                              <TableHead className="text-right">Paid</TableHead>
                              <TableHead className="text-right">Outstanding</TableHead>
                              <TableHead className="text-center">Entries</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {caseSummaries.map((cs) => (
                              <TableRow key={cs.case_id} className="hover:bg-gray-50">
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{cs.case_number}</p>
                                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                      {cs.case_title}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {cs.case_type?.replace(/_/g, ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(cs.total_amount)}
                                </TableCell>
                                <TableCell className="text-right text-green-600">
                                  {formatCurrency(cs.total_paid)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {cs.total_outstanding > 0 ? (
                                    <span className="text-amber-600 font-medium">
                                      {formatCurrency(cs.total_outstanding)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {cs.total_cost_entries}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/cases/${cs.case_id}`)}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        No cases with costs found for the selected filters
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* All Entries Tab */}
              <TabsContent value="all-entries">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">All Cost Entries</CardTitle>
                    <CardDescription>
                      Showing {filteredCosts.length} of {costs.length} entries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredCosts.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead>Date</TableHead>
                              <TableHead>Case</TableHead>
                              <TableHead>Cost Type</TableHead>
                              <TableHead>Payee</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCosts.slice(0, 50).map((cost) => (
                              <TableRow key={cost.id} className="hover:bg-gray-50">
                                <TableCell className="text-sm">
                                  {format(new Date(cost.date_incurred), 'dd MMM yyyy')}
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm font-medium">{cost.cases?.case_number}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">{cost.cost_type}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">{cost.payee_name || '—'}</p>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(cost.amount)}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(cost.payment_status)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/cases/${cost.case_id}`)}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        No cost entries found for the selected filters
                      </div>
                    )}
                    {filteredCosts.length > 50 && (
                      <p className="text-center text-sm text-gray-500 mt-4">
                        Showing first 50 entries. Export to Excel for full data.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

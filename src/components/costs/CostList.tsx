'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import {
  DollarSign,
  Search,
  Filter,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { LitigationCost, PAYMENT_STATUS_OPTIONS } from '@/types/litigation-costs';
import { AddCostDialog } from '@/components/forms/AddCostDialog';
import { EditCostDialog } from '@/components/forms/EditCostDialog';
import { CostDocumentManager } from '@/components/costs/CostDocumentManager';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface CostListProps {
  caseId: string;
  onRefresh?: () => void;
}

export function CostList({ caseId, onRefresh }: CostListProps) {
  const [loading, setLoading] = useState(true);
  const [costs, setCosts] = useState<LitigationCost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<LitigationCost | null>(null);

  useEffect(() => {
    loadCosts();
  }, [caseId]);

  async function loadCosts() {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('litigation_costs')
        .select(`
          *,
          cost_categories (
            id,
            code,
            name,
            category_group
          )
        `)
        .eq('case_id', caseId)
        .eq('is_deleted', false)
        .order('date_incurred', { ascending: false });

      if (fetchError) throw fetchError;
      setCosts(data || []);
    } catch (err) {
      console.error('Error loading costs:', err);
      setError('Failed to load cost entries');
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (cost: LitigationCost) => {
    setSelectedCost(cost);
    setEditDialogOpen(true);
  };

  const handleDelete = async (costId: string) => {
    if (!confirm('Are you sure you want to delete this cost entry?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase as any)
        .from('litigation_costs')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id
        })
        .eq('id', costId);

      if (error) throw error;
      loadCosts();
      onRefresh?.();
    } catch (err) {
      console.error('Error deleting cost:', err);
      alert('Failed to delete cost entry');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = PAYMENT_STATUS_OPTIONS.find(s => s.value === status);
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      unpaid: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      waived: 'bg-gray-100 text-gray-800 border-gray-200',
      disputed: 'bg-orange-100 text-orange-800 border-orange-200',
    };

    return (
      <Badge className={`${colors[status] || colors.unpaid} border`}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  // Filter costs
  const filteredCosts = costs.filter(cost => {
    const matchesSearch =
      cost.cost_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cost.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cost.payee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cost.reference_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cost.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate totals for filtered costs
  const totalAmount = filteredCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = filteredCosts.reduce((sum, c) => sum + c.amount_paid, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[#8B2332]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-10 text-red-600">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadCosts}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-[#8B2332]" />
              Cost Entries
              <Badge variant="outline" className="ml-2">
                {costs.length} entries
              </Badge>
            </CardTitle>
            <AddCostDialog caseId={caseId} onCostAdded={() => { loadCosts(); onRefresh?.(); }} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by type, payee, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {PAYMENT_STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Bar */}
          <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg text-sm">
            <div>
              <span className="text-gray-500">Showing:</span>{' '}
              <span className="font-medium">{filteredCosts.length} of {costs.length} entries</span>
            </div>
            <div className="border-l pl-4">
              <span className="text-gray-500">Total:</span>{' '}
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="border-l pl-4">
              <span className="text-gray-500">Paid:</span>{' '}
              <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="border-l pl-4">
              <span className="text-gray-500">Outstanding:</span>{' '}
              <span className="font-medium text-amber-600">{formatCurrency(totalAmount - totalPaid)}</span>
            </div>
          </div>

          {/* Table */}
          {filteredCosts.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Date</TableHead>
                    <TableHead>Cost Type</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Docs</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCosts.map((cost) => (
                    <TableRow key={cost.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {format(new Date(cost.date_incurred), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{cost.cost_type}</p>
                          {cost.reference_number && (
                            <p className="text-xs text-gray-500">Ref: {cost.reference_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cost.payee_name ? (
                          <div>
                            <p className="text-sm">{cost.payee_name}</p>
                            {cost.payee_type && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {cost.payee_type.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(cost.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cost.payment_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {cost.amount - cost.amount_paid > 0 ? (
                          <span className="text-amber-600 font-medium">
                            {formatCurrency(cost.amount - cost.amount_paid)}
                          </span>
                        ) : (
                          <span className="text-green-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <CostDocumentManager
                          costId={cost.id}
                          costType={cost.cost_type}
                          onDocumentChange={loadCosts}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(cost)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Cost
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(cost.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-1">No cost entries found</p>
              <p className="text-sm mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first cost entry to start tracking litigation expenses'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <AddCostDialog caseId={caseId} onCostAdded={() => { loadCosts(); onRefresh?.(); }} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedCost && (
        <EditCostDialog
          cost={selectedCost}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onCostUpdated={() => { loadCosts(); onRefresh?.(); }}
        />
      )}
    </>
  );
}

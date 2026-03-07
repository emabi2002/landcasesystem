'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface IntakeRecord {
  id: string;
  internal_serial_number: string;
  document_type: string;
  from_party_type: string;
  from_office_name: string;
  delivered_by_name: string;
  status: string;
  urgent: boolean;
  date_stamped: string;
  received_date: string;
}

export default function IntakeListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<IntakeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<IntakeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    checkAuth();
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, statusFilter]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    }
  };

  const loadRecords = async () => {
    try {
      const response = await fetch('/api/reception/register');
      const result = await response.json();

      if (result.success) {
        setRecords(result.records);
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.internal_serial_number?.toLowerCase().includes(term) ||
        r.from_office_name?.toLowerCase().includes(term) ||
        r.delivered_by_name?.toLowerCase().includes(term) ||
        r.document_type?.toLowerCase().includes(term)
      );
    }

    setFilteredRecords(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      received: { label: 'Received', variant: 'secondary' },
      scanned: { label: 'Scanned', variant: 'default' },
      acknowledged: { label: 'Acknowledged', variant: 'default' },
      assigned_to_case: { label: 'Assigned', variant: 'outline' },
      archived: { label: 'Archived', variant: 'outline' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      section_5_notice: 'Section 5 Notice',
      search_warrant: 'Search Warrant',
      court_order: 'Court Order',
      summons_ombudsman: 'Summons (Ombudsman)',
      general_correspondence: 'General Correspondence',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const todayCount = records.filter(r => {
    const recordDate = new Date(r.received_date);
    const today = new Date();
    return recordDate.toDateString() === today.toDateString();
  }).length;

  const urgentCount = records.filter(r => r.urgent).length;
  const pendingAckCount = records.filter(r => r.status === 'received' || r.status === 'scanned').length;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Intake Records</h1>
            <p className="text-gray-600 mt-2">All documents received at front counter</p>
          </div>
          <Link href="/reception">
            <Button style={{ background: '#EF5A5A' }} className="text-white">
              <Plus className="mr-2 h-4 w-4" />
              Register New Document
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today</p>
                  <p className="text-2xl font-bold">{todayCount}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold">{records.length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold">{urgentCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Ack.</p>
                  <p className="text-2xl font-bold">{pendingAckCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by serial number, office, or document type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-4 py-2"
              >
                <option value="all">All Status</option>
                <option value="received">Received</option>
                <option value="scanned">Scanned</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="assigned_to_case">Assigned to Case</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Intake Records ({filteredRecords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No intake records found</p>
                <Link href="/reception">
                  <Button>Register First Document</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Delivered By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono font-semibold">
                          {record.internal_serial_number}
                          {record.urgent && (
                            <AlertCircle className="inline ml-2 h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>{getDocumentTypeLabel(record.document_type)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.from_office_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500 capitalize">
                              {record.from_party_type?.replace('_', ' ')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{record.delivered_by_name || 'N/A'}</TableCell>
                        <TableCell>
                          {record.date_stamped ? format(new Date(record.date_stamped), 'MMM dd, yyyy HH:mm') : 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

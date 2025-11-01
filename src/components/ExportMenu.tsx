'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { exportCaseDataAsCSV, exportCaseDataAsJSON } from '@/lib/export-utils';
import { toast } from 'sonner';

interface ExportMenuProps {
  caseData: {
    case_number: string;
    title: string;
    status: string;
    case_type: string;
    priority: string;
    region?: string;
    created_at: string;
    description?: string;
  };
  parties: unknown[];
  tasks: unknown[];
  events: unknown[];
  documents: unknown[];
  landParcels: unknown[];
}

export function ExportMenu({ caseData, parties, tasks, events, documents, landParcels }: ExportMenuProps) {
  const handleExportCSV = () => {
    try {
      exportCaseDataAsCSV(caseData, parties, tasks, events, landParcels);
      toast.success('Case data exported as CSV files');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export case data');
    }
  };

  const handleExportJSON = () => {
    try {
      exportCaseDataAsJSON(caseData, parties, tasks, events, documents, landParcels);
      toast.success('Case data exported as JSON');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export case data');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Case Data</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export as CSV (Multiple Files)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <Download className="mr-2 h-4 w-4" />
          Export as JSON (Complete Data)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

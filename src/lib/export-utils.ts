import { format } from 'date-fns';

// Convert data to CSV format
export function convertToCSV(data: Record<string, unknown>[], headers: string[]): string {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Download file to user's computer
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export case data as CSV
export function exportCaseDataAsCSV(caseData: {
  case_number: string;
  title: string;
  status: string;
  case_type: string;
  priority: string;
  region?: string;
  created_at: string;
  description?: string;
}, parties: unknown[], tasks: unknown[], events: unknown[], landParcels: unknown[]) {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const caseNumber = caseData.case_number.replace(/[^a-zA-Z0-9]/g, '-');
  
  // Export parties
  if (parties.length > 0) {
    const partiesCSV = convertToCSV(
      parties as Record<string, unknown>[],
      ['name', 'party_type', 'role', 'contact_info']
    );
    downloadFile(partiesCSV, `${caseNumber}-parties-${timestamp}.csv`, 'text/csv');
  }
  
  // Export tasks
  if (tasks.length > 0) {
    const tasksCSV = convertToCSV(
      tasks as Record<string, unknown>[],
      ['title', 'description', 'due_date', 'status', 'priority']
    );
    downloadFile(tasksCSV, `${caseNumber}-tasks-${timestamp}.csv`, 'text/csv');
  }
  
  // Export events
  if (events.length > 0) {
    const eventsCSV = convertToCSV(
      events as Record<string, unknown>[],
      ['title', 'description', 'event_date', 'event_type', 'location']
    );
    downloadFile(eventsCSV, `${caseNumber}-events-${timestamp}.csv`, 'text/csv');
  }
  
  // Export land parcels
  if (landParcels.length > 0) {
    const parcelsCSV = convertToCSV(
      landParcels as Record<string, unknown>[],
      ['parcel_number', 'location', 'area', 'notes']
    );
    downloadFile(parcelsCSV, `${caseNumber}-land-parcels-${timestamp}.csv`, 'text/csv');
  }
}

// Export full case data as JSON
export function exportCaseDataAsJSON(
  caseData: unknown,
  parties: unknown[],
  tasks: unknown[],
  events: unknown[],
  documents: unknown[],
  landParcels: unknown[]
) {
  const fullData = {
    case: caseData,
    parties,
    tasks,
    events,
    documents: documents.map((doc: unknown) => {
      // Remove file_path from export for security
      const { file_path, ...rest } = doc as Record<string, unknown>;
      return rest;
    }),
    landParcels,
    exportedAt: new Date().toISOString(),
  };
  
  const jsonContent = JSON.stringify(fullData, null, 2);
  const caseNumber = (caseData as { case_number: string }).case_number.replace(/[^a-zA-Z0-9]/g, '-');
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  
  downloadFile(jsonContent, `${caseNumber}-full-export-${timestamp}.json`, 'application/json');
}

// Export documents list as CSV
export function exportDocumentsAsCSV(documents: unknown[]) {
  if (documents.length === 0) return;
  
  const docsCSV = convertToCSV(
    documents as Record<string, unknown>[],
    ['title', 'description', 'file_type', 'uploaded_at']
  );
  
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  downloadFile(docsCSV, `documents-list-${timestamp}.csv`, 'text/csv');
}

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatDate } from 'date-fns';

// Excel Export Functions
export function exportToExcel(data: unknown[], filename: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const maxWidth = 50;
  const cols = Object.keys(data[0] || {}).map(key => ({
    wch: Math.min(maxWidth, Math.max(10, key.length + 5))
  }));
  worksheet['!cols'] = cols;
  
  XLSX.writeFile(workbook, filename);
}

export function exportMultiSheetExcel(
  sheets: Array<{ name: string; data: unknown[] }>,
  filename: string
) {
  const workbook = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  
  XLSX.writeFile(workbook, filename);
}

// PDF Export Functions
export function exportToPDF(
  title: string,
  columns: string[],
  data: (string | number)[][],
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const doc = new jsPDF(orientation);
  
  // Add header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);
  
  // Add metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date(), 'PPpp')}`, 14, 28);
  doc.text('Department of Lands & Physical Planning', 14, 34);
  
  // Add table
  autoTable(doc, {
    startY: 40,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [74, 66, 132], // DLPP Purple
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });
  
  doc.save(filename);
}

// Case Summary Report
export async function generateCaseSummaryReport(cases: unknown[], format: 'excel' | 'pdf') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const reportData = (cases as Array<{
    case_number: string;
    title: string;
    status: string;
    case_type: string;
    priority: string;
    region?: string;
    created_at: string;
  }>).map(c => ({
    'Case Number': c.case_number,
    'Title': c.title,
    'Type': c.case_type.replace('_', ' '),
    'Status': c.status,
    'Priority': c.priority,
    'Region': c.region || 'N/A',
    'Created': new Date(c.created_at).toLocaleDateString(),
  }));
  
  if (format === 'excel') {
    exportToExcel(reportData, `case-summary-${timestamp}.xlsx`, 'Cases');
  } else {
    const columns = ['Case Number', 'Title', 'Type', 'Status', 'Priority', 'Region', 'Created'];
    const data = reportData.map(row => Object.values(row));
    exportToPDF('Case Summary Report', columns, data, `case-summary-${timestamp}.pdf`, 'landscape');
  }
}

// Case Statistics Report
export async function generateStatisticsReport(stats: {
  totalCases: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byRegion: Record<string, number>;
  byPriority: Record<string, number>;
}, format: 'excel' | 'pdf') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const summaryData = [
    { Metric: 'Total Cases', Value: stats.totalCases },
  ];
  
  const statusData = Object.entries(stats.byStatus).map(([status, count]) => ({
    Status: status.replace('_', ' ').toUpperCase(),
    Count: count,
    Percentage: `${((count / stats.totalCases) * 100).toFixed(1)}%`,
  }));
  
  const typeData = Object.entries(stats.byType).map(([type, count]) => ({
    'Case Type': type.replace('_', ' ').toUpperCase(),
    Count: count,
    Percentage: `${((count / stats.totalCases) * 100).toFixed(1)}%`,
  }));
  
  const regionData = Object.entries(stats.byRegion).map(([region, count]) => ({
    Region: region,
    Count: count,
    Percentage: `${((count / stats.totalCases) * 100).toFixed(1)}%`,
  }));
  
  if (format === 'excel') {
    exportMultiSheetExcel([
      { name: 'Summary', data: summaryData },
      { name: 'By Status', data: statusData },
      { name: 'By Type', data: typeData },
      { name: 'By Region', data: regionData },
    ], `case-statistics-${timestamp}.xlsx`);
  } else {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Case Statistics Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${formatDate(new Date(), 'PPpp')}`, 14, 28);
    
    let yPos = 40;
    
    // Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Cases: ${stats.totalCases}`, 20, yPos);
    yPos += 15;
    
    // By Status
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cases by Status', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData.map(row => [row.Status, row.Count, row.Percentage]),
      theme: 'grid',
      headStyles: { fillColor: [74, 66, 132] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // By Type
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cases by Type', 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Case Type', 'Count', 'Percentage']],
      body: typeData.map(row => [row['Case Type'], row.Count, row.Percentage]),
      theme: 'grid',
      headStyles: { fillColor: [74, 66, 132] },
    });
    
    doc.save(`case-statistics-${timestamp}.pdf`);
  }
}

// Task Report
export async function generateTaskReport(tasks: unknown[], format: 'excel' | 'pdf') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const reportData = (tasks as Array<{
    title: string;
    status: string;
    priority?: string;
    due_date: string;
    assigned_to?: string;
    case_number?: string;
  }>).map(t => ({
    'Task': t.title,
    'Status': t.status.replace('_', ' ').toUpperCase(),
    'Priority': (t.priority || 'N/A').toUpperCase(),
    'Due Date': new Date(t.due_date).toLocaleDateString(),
    'Assigned To': t.assigned_to || 'Unassigned',
    'Case': t.case_number || 'N/A',
  }));
  
  if (format === 'excel') {
    exportToExcel(reportData, `task-report-${timestamp}.xlsx`, 'Tasks');
  } else {
    const columns = ['Task', 'Status', 'Priority', 'Due Date', 'Assigned To', 'Case'];
    const data = reportData.map(row => Object.values(row));
    exportToPDF('Task Status Report', columns, data, `task-report-${timestamp}.pdf`, 'landscape');
  }
}

// Document Register Report
export async function generateDocumentRegister(documents: unknown[], format: 'excel' | 'pdf') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const reportData = (documents as Array<{
    title: string;
    file_type?: string;
    uploaded_at: string;
    case_number?: string;
  }>).map(d => ({
    'Document Title': d.title,
    'Type': (d.file_type || 'N/A').replace('_', ' '),
    'Upload Date': new Date(d.uploaded_at).toLocaleDateString(),
    'Case Number': d.case_number || 'N/A',
  }));
  
  if (format === 'excel') {
    exportToExcel(reportData, `document-register-${timestamp}.xlsx`, 'Documents');
  } else {
    const columns = ['Document Title', 'Type', 'Upload Date', 'Case Number'];
    const data = reportData.map(row => Object.values(row));
    exportToPDF('Document Register', columns, data, `document-register-${timestamp}.pdf`, 'landscape');
  }
}

// Land Parcels Report
export async function generateLandParcelsReport(parcels: unknown[], format: 'excel' | 'pdf') {
  const timestamp = new Date().toISOString().split('T')[0];
  
  const reportData = (parcels as Array<{
    parcel_number: string;
    location?: string;
    area?: number;
    case_number?: string;
  }>).map(p => ({
    'Parcel Number': p.parcel_number,
    'Location': p.location || 'N/A',
    'Area (ha)': p.area || 'N/A',
    'Case Number': p.case_number || 'N/A',
  }));
  
  if (format === 'excel') {
    exportToExcel(reportData, `land-parcels-${timestamp}.xlsx`, 'Land Parcels');
  } else {
    const columns = ['Parcel Number', 'Location', 'Area (ha)', 'Case Number'];
    const data = reportData.map(row => Object.values(row));
    exportToPDF('Land Parcels Report', columns, data, `land-parcels-${timestamp}.pdf`, 'landscape');
  }
}

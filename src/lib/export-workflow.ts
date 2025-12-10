import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface CorrespondenceData {
  reference_number: string;
  document_type?: string;
  source?: string;
  subject: string;
  received_date: string;
  status: string;
  acknowledgement_sent: boolean;
}

interface DirectionData {
  direction_number: string;
  source?: string | null;
  subject: string;
  priority: string;
  issued_date: string;
  due_date?: string | null;
  status: string;
}

interface FileRequestData {
  file_type?: string | null;
  file_number?: string | null;
  requested_date: string;
  status: string;
  received_date?: string | null;
  current_location?: string | null;
}

interface FilingData {
  title: string;
  filing_type?: string | null;
  filing_number?: string | null;
  prepared_date?: string | null;
  submission_date?: string | null;
  status: string;
}

interface LawyerData {
  name: string;
  organization: string;
  lawyer_type?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  specialization?: string | null;
  active: boolean;
}

interface CommunicationData {
  subject: string;
  communication_type: string;
  direction: string;
  party_type?: string | null;
  party_name?: string | null;
  communication_date: string;
  response_required: boolean;
  response_status: string;
}

interface ComplianceData {
  court_order_reference?: string | null;
  court_order_description: string;
  court_order_date?: string | null;
  responsible_division?: string | null;
  compliance_deadline?: string | null;
  compliance_status: string;
  completion_date?: string | null;
}

interface PDFData {
  [key: string]: string | number | boolean | undefined | null;
}

// Export Correspondence to Excel
export const exportCorrespondence = (data: CorrespondenceData[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => ({
      'Reference Number': item.reference_number,
      'Document Type': item.document_type?.replace(/_/g, ' ').toUpperCase(),
      'Source': item.source?.replace(/_/g, ' '),
      'Subject': item.subject,
      'Received Date': format(new Date(item.received_date), 'PPP'),
      'Status': item.status,
      'Acknowledged': item.acknowledgement_sent ? 'Yes' : 'No',
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Correspondence');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Export Directions to Excel
export const exportDirections = (data: DirectionData[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => ({
      'Direction Number': item.direction_number,
      'Source': item.source?.replace(/_/g, ' '),
      'Subject': item.subject,
      'Priority': item.priority,
      'Issued Date': format(new Date(item.issued_date), 'PPP'),
      'Due Date': item.due_date ? format(new Date(item.due_date), 'PPP') : 'N/A',
      'Status': item.status,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Directions');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Export File Requests to Excel
export const exportFileRequests = (data: FileRequestData[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => ({
      'File Type': item.file_type?.replace(/_/g, ' ').toUpperCase(),
      'File Number': item.file_number || 'N/A',
      'Requested Date': format(new Date(item.requested_date), 'PPP'),
      'Status': item.status,
      'Received Date': item.received_date ? format(new Date(item.received_date), 'PPP') : 'N/A',
      'Current Location': item.current_location || 'N/A',
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'File Requests');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Export Filings to Excel
export const exportFilings = (data: FilingData[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => ({
      'Title': item.title,
      'Filing Type': item.filing_type?.replace(/_/g, ' ').toUpperCase(),
      'Filing Number': item.filing_number || 'N/A',
      'Prepared Date': item.prepared_date ? format(new Date(item.prepared_date), 'PPP') : 'N/A',
      'Submission Date': item.submission_date ? format(new Date(item.submission_date), 'PPP') : 'N/A',
      'Status': item.status,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Filings');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Export Lawyers to Excel
export const exportLawyers = (data: LawyerData[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => ({
      'Name': item.name,
      'Organization': item.organization,
      'Type': item.lawyer_type?.replace(/_/g, ' ').toUpperCase(),
      'Email': item.contact_email || 'N/A',
      'Phone': item.contact_phone || 'N/A',
      'Specialization': item.specialization || 'N/A',
      'Active': item.active ? 'Yes' : 'No',
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lawyers');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Export Communications to Excel
export const exportCommunications = (data: CommunicationData[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => ({
      'Subject': item.subject,
      'Type': item.communication_type,
      'Direction': item.direction,
      'Party Type': item.party_type?.replace(/_/g, ' '),
      'Party Name': item.party_name || 'N/A',
      'Date': format(new Date(item.communication_date), 'PPP'),
      'Response Required': item.response_required ? 'Yes' : 'No',
      'Response Status': item.response_status,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Communications');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Export Compliance Tracking to Excel
export const exportCompliance = (data: ComplianceData[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map((item) => ({
      'Court Order Reference': item.court_order_reference || 'N/A',
      'Description': item.court_order_description,
      'Order Date': item.court_order_date ? format(new Date(item.court_order_date), 'PPP') : 'N/A',
      'Responsible Division': item.responsible_division?.replace(/_/g, ' '),
      'Deadline': item.compliance_deadline ? format(new Date(item.compliance_deadline), 'PPP') : 'N/A',
      'Status': item.compliance_status,
      'Completed': item.completion_date ? format(new Date(item.completion_date), 'PPP') : 'N/A',
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Compliance');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// Export to PDF
export const exportToPDF = (data: PDFData[], columns: string[], title: string, fileName: string) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 14, 22);

  // Convert data to table body format
  const tableBody = data.map(row => columns.map(col => {
    const value = row[col];
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value?.toString() || '';
  }));

  // Add table
  autoTable(doc, {
    head: [columns],
    body: tableBody,
    startY: 30,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [74, 66, 132] }, // DLPP purple
  });

  doc.save(`${fileName}.pdf`);
};

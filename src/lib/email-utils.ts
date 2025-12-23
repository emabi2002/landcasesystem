import { supabase } from './supabase';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailAttachment {
  filename: string;
  url: string;
  size?: number;
}

interface SendEmailParams {
  to: EmailRecipient;
  cc?: EmailRecipient[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  attachments?: EmailAttachment[];
  caseId?: string;
}

// Queue email for sending
export async function queueEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('email_queue').insert([
      {
        to_email: params.to.email,
        to_name: params.to.name,
        cc_emails: params.cc?.map(c => c.email),
        subject: params.subject,
        body_html: params.bodyHtml,
        body_text: params.bodyText || stripHtml(params.bodyHtml),
        attachments: params.attachments || [],
        case_id: params.caseId,
        created_by: user?.id,
        status: 'pending',
      } as never,
    ]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error queuing email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Generate case assignment email
export function generateCaseAssignmentEmail(
  caseNumber: string,
  caseTitle: string,
  assignedOfficer: string,
  assignedBy: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #4A4284; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .case-info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4A4284; margin: 20px 0; }
        .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        .button { background-color: #EF5A5A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DLPP Legal Case Management System</h1>
        <p>Department of Lands & Physical Planning</p>
      </div>

      <div class="content">
        <h2>New Case Assigned</h2>
        <p>Dear ${assignedOfficer},</p>
        <p>You have been assigned to a new case by ${assignedBy}.</p>

        <div class="case-info">
          <h3>Case Details:</h3>
          <p><strong>Case Number:</strong> ${caseNumber}</p>
          <p><strong>Title:</strong> ${caseTitle}</p>
          <p><strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>Please log in to the system to review the case details and take necessary action.</p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cases" class="button">
          View Case
        </a>

        <p>Thank you,<br>DLPP Legal Team</p>
      </div>

      <div class="footer">
        <p>This is an automated email from DLPP Legal Case Management System</p>
        <p>Please do not reply to this email</p>
      </div>
    </body>
    </html>
  `;
}

// Generate event reminder email
export function generateEventReminderEmail(
  eventTitle: string,
  eventDate: Date,
  eventLocation: string | null,
  caseNumber: string,
  daysUntil: number
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #4A4284; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .event-info { background-color: #fff3cd; padding: 15px; border-left: 4px solid #EF5A5A; margin: 20px 0; }
        .urgent { color: #EF5A5A; font-weight: bold; }
        .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DLPP Legal Case Management System</h1>
        <p>Event Reminder</p>
      </div>

      <div class="content">
        <h2 class="urgent">${daysUntil === 0 ? 'Event Today!' : `Event in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}</h2>

        <div class="event-info">
          <h3>Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString()}</p>
          ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
          <p><strong>Related Case:</strong> ${caseNumber}</p>
        </div>

        <p>Please ensure you are prepared for this event.</p>

        <p>Thank you,<br>DLPP Legal Team</p>
      </div>

      <div class="footer">
        <p>This is an automated email from DLPP Legal Case Management System</p>
      </div>
    </body>
    </html>
  `;
}

// Generate document forwarding email
export function generateDocumentForwardEmail(
  recipient: string,
  documentTitle: string,
  caseNumber: string,
  documentUrl: string,
  message?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #4A4284; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .doc-info { background-color: #e3f2fd; padding: 15px; border-left: 4px solid #4A4284; margin: 20px 0; }
        .button { background-color: #4A4284; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DLPP Legal Case Management System</h1>
        <p>Document Forwarding</p>
      </div>

      <div class="content">
        <p>Dear ${recipient},</p>

        ${message ? `<p>${message}</p>` : '<p>Please find the attached document for your review.</p>'}

        <div class="doc-info">
          <h3>Document Information:</h3>
          <p><strong>Document:</strong> ${documentTitle}</p>
          <p><strong>Related Case:</strong> ${caseNumber}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <a href="${documentUrl}" class="button">Download Document</a>

        <p>Best regards,<br>DLPP Legal Team</p>
      </div>

      <div class="footer">
        <p>This is an automated email from DLPP Legal Case Management System</p>
      </div>
    </body>
    </html>
  `;
}

// Generate compliance reminder email
export function generateComplianceReminderEmail(
  courtOrderDescription: string,
  division: string,
  deadline: Date,
  caseNumber: string
): string {
  const daysUntil = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #4A4284; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .compliance-info { background-color: #fee; padding: 15px; border-left: 4px solid #EF5A5A; margin: 20px 0; }
        .urgent { color: #EF5A5A; font-weight: bold; }
        .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DLPP Legal Case Management System</h1>
        <p>Compliance Reminder</p>
      </div>

      <div class="content">
        <h2 class="urgent">Court Order Compliance Required</h2>
        <p>To: ${division.replace(/_/g, ' ').toUpperCase()}</p>

        <div class="compliance-info">
          <h3>Compliance Details:</h3>
          <p><strong>Court Order:</strong> ${courtOrderDescription}</p>
          <p><strong>Related Case:</strong> ${caseNumber}</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleDateString()}</p>
          <p class="urgent">${daysUntil <= 0 ? 'OVERDUE!' : `${daysUntil} days remaining`}</p>
        </div>

        <p>Please ensure compliance with the court order before the deadline.</p>

        <p>DLPP Legal Team</p>
      </div>

      <div class="footer">
        <p>This is an automated email from DLPP Legal Case Management System</p>
      </div>
    </body>
    </html>
  `;
}

// Helper function to strip HTML tags for plain text version
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

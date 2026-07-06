/**
 * Notification helpers for the Section 160(2) Application Register.
 *
 * When an application is assigned to a DLPP lawyer, or its status changes, the
 * assigned lawyer (identified by their linked system user id) is alerted via the
 * shared `notifications` table — the same table the NotificationCenter reads.
 *
 * If the lawyer has no linked system account, no alert is sent — the function
 * fails silently so saving an application is never blocked.
 */

import { supabase } from './supabase';
import type { Section160Application } from './section-160';

interface MinimalApp {
  id: string;
  application_year?: string | null;
  case_id: string | null;
  defendant?: string | null;
  court_file_reference_no?: string | null;
}

function ref(a: MinimalApp): string {
  if (a.court_file_reference_no) return a.court_file_reference_no;
  if (a.application_year) return `Section 160(2) Application ${a.application_year}`;
  return 'a Section 160(2) Application';
}

async function insertNotification(row: {
  user_id: string;
  case_id: string | null;
  title: string;
  message: string;
}) {
  try {
    const { error } = await (supabase as any).from('notifications').insert({
      user_id: row.user_id,
      case_id: row.case_id,
      title: row.title,
      message: row.message,
      type: 'case',
    });
    if (error) console.warn('Section 160 notification not sent:', error.message);
  } catch (err) {
    console.warn('Section 160 notification error:', err);
  }
}

export async function notifyLawyerAssigned(
  recipientUserId: string | null | undefined,
  app: MinimalApp,
) {
  if (!recipientUserId) return;
  await insertNotification({
    user_id: recipientUserId,
    case_id: app.case_id,
    title: 'Section 160(2) Application assigned to you',
    message: `You have been assigned ${ref(app)}${
      app.defendant ? ` (defendant: ${app.defendant})` : ''
    }. Please review and action it.`,
  });
}

export async function notifyStatusChanged(
  recipientUserId: string | null | undefined,
  app: MinimalApp,
  fromStatus: string | null | undefined,
  toStatus: string,
) {
  if (!recipientUserId) return;
  await insertNotification({
    user_id: recipientUserId,
    case_id: app.case_id,
    title: `Section 160(2) status: ${toStatus}`,
    message: `${ref(app)} moved from “${fromStatus ?? '—'}” to “${toStatus}”.`,
  });
}

/** Convenience used by the dialog after a successful save. */
export async function sendSection160Notifications(params: {
  isEdit: boolean;
  before: Section160Application | null;
  after: MinimalApp & { dlpp_lawyer_user_id: string | null; status_of_matter: string };
}) {
  const { isEdit, before, after } = params;
  const newLawyer = after.dlpp_lawyer_user_id || null;

  if (!isEdit) {
    if (newLawyer) await notifyLawyerAssigned(newLawyer, after);
    return;
  }

  const oldLawyer = before?.dlpp_lawyer_user_id || null;
  const lawyerChanged = newLawyer !== oldLawyer;
  const statusChanged = (before?.status_of_matter ?? '') !== after.status_of_matter;

  if (lawyerChanged && newLawyer) {
    await notifyLawyerAssigned(newLawyer, after);
  }
  if (statusChanged && newLawyer) {
    await notifyStatusChanged(newLawyer, after, before?.status_of_matter, after.status_of_matter);
  }
}

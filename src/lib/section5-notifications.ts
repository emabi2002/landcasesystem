/**
 * Notification helpers for the Section 5 Notice Register.
 *
 * When a notice is assigned to a DLPP lawyer, or its status changes, the
 * assigned lawyer (identified by their linked system user id) is alerted via the
 * shared `notifications` table — the same table the NotificationCenter reads.
 *
 * Recipient resolution: the notice stores `dlpp_lawyer_user_id` (the lawyer's
 * system account). If that is missing (e.g. the lawyer has no login), no alert
 * is sent — the function fails silently so saving a notice is never blocked.
 */

import { supabase } from './supabase';
import type { Section5Notice } from './section5-notices';

interface MinimalNotice {
  id: string;
  notice_number: string | null;
  case_id: string | null;
  claimant_name?: string | null;
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
      type: 'case', // renders with the case icon/colour in the NotificationCenter
    });
    if (error) {
      // Non-fatal: log and continue. Saving the notice must not fail because a
      // notification could not be written.
      console.warn('Section 5 notification not sent:', error.message);
    }
  } catch (err) {
    console.warn('Section 5 notification error:', err);
  }
}

/** Alert a lawyer that a Section 5 Notice has been assigned to them. */
export async function notifyLawyerAssigned(
  recipientUserId: string | null | undefined,
  notice: MinimalNotice,
) {
  if (!recipientUserId) return;
  const ref = notice.notice_number || 'a Section 5 Notice';
  await insertNotification({
    user_id: recipientUserId,
    case_id: notice.case_id,
    title: 'Section 5 Notice assigned to you',
    message: `You have been assigned Section 5 Notice ${ref}${
      notice.claimant_name ? ` (claimant: ${notice.claimant_name})` : ''
    }. Please review and action it.`,
  });
}

/** Alert the assigned lawyer that a Section 5 Notice's status changed. */
export async function notifyStatusChanged(
  recipientUserId: string | null | undefined,
  notice: MinimalNotice,
  fromStatus: string | null | undefined,
  toStatus: string,
) {
  if (!recipientUserId) return;
  const ref = notice.notice_number || 'a Section 5 Notice';
  await insertNotification({
    user_id: recipientUserId,
    case_id: notice.case_id,
    title: `Section 5 Notice status: ${toStatus}`,
    message: `Section 5 Notice ${ref} moved from “${fromStatus ?? '—'}” to “${toStatus}”.`,
  });
}

/**
 * Convenience used by the dialog after a successful save. It figures out which
 * alerts to send based on what changed.
 */
export async function sendSection5Notifications(params: {
  isEdit: boolean;
  before: Section5Notice | null;
  after: MinimalNotice & { dlpp_lawyer_user_id: string | null; current_status: string };
}) {
  const { isEdit, before, after } = params;
  const newLawyer = after.dlpp_lawyer_user_id || null;

  if (!isEdit) {
    // Newly registered with a lawyer already assigned.
    if (newLawyer) await notifyLawyerAssigned(newLawyer, after);
    return;
  }

  const oldLawyer = before?.dlpp_lawyer_user_id || null;
  const lawyerChanged = newLawyer !== oldLawyer;
  const statusChanged = (before?.current_status ?? '') !== after.current_status;

  // New assignment → tell the new lawyer.
  if (lawyerChanged && newLawyer) {
    await notifyLawyerAssigned(newLawyer, after);
  }

  // Status change → tell whoever currently holds the notice.
  if (statusChanged && newLawyer) {
    await notifyStatusChanged(newLawyer, after, before?.current_status, after.current_status);
  }
}

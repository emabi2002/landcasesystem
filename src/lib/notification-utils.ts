import { supabase } from './supabase';

export interface NotificationRecipient {
  role: string;
  title: string;
}

export interface CaseNotification {
  case_id: string;
  case_number: string;
  case_title: string;
  case_type: string;
  created_by: string;
  created_by_name?: string;
}

// Roles that receive automatic notifications for new cases
export const CASE_CREATION_RECIPIENTS: NotificationRecipient[] = [
  { role: 'secretary', title: 'Secretary' },
  { role: 'director_legal', title: 'Director Legal' },
  { role: 'manager_legal', title: 'Manager Legal' }
];

/**
 * Send notifications to specific roles when a new case is created
 */
export async function notifyNewCase(caseData: CaseNotification): Promise<{ success: boolean; error?: string }> {
  try {
    // Get all users with the specified roles
    const targetRoles = CASE_CREATION_RECIPIENTS.map(r => r.role);

    const { data: recipients, error: recipientsError } = await (supabase as any)
      .from('profiles')
      .select('id, email, full_name, role')
      .in('role', targetRoles)
      .eq('is_active', true);

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      return { success: false, error: 'Failed to fetch notification recipients' };
    }

    if (!recipients || recipients.length === 0) {
      console.warn('No recipients found for case notifications');
      return { success: true }; // Not an error, just no recipients
    }

    // Get creator name if not provided
    let creatorName = caseData.created_by_name;
    if (!creatorName) {
      const { data: creator } = await (supabase as any)
        .from('profiles')
        .select('full_name')
        .eq('id', caseData.created_by)
        .single();
      creatorName = creator?.full_name || 'Unknown User';
    }

    // Create notification records for each recipient
    const notifications = recipients.map((recipient: any) => ({
      user_id: recipient.id,
      case_id: caseData.case_id,
      title: 'New Case Created - Input Required',
      message: `A new case "${caseData.case_title}" (${caseData.case_number}) has been created by ${creatorName}. Your commentary, advice, and input are requested.`,
      type: 'case_created',
      priority: 'high',
      read: false,
      action_required: true,
      action_url: `/cases/${caseData.case_id}`,
      metadata: {
        case_id: caseData.case_id,
        case_number: caseData.case_number,
        case_title: caseData.case_title,
        case_type: caseData.case_type,
        created_by: caseData.created_by,
        created_by_name: creatorName,
        recipient_role: recipient.role,
        requires_input: true
      },
      created_at: new Date().toISOString()
    }));

    const { error: notificationError } = await (supabase as any)
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating notifications:', notificationError);
      return { success: false, error: 'Failed to create notifications' };
    }

    // Log the notification activity
    await logNotificationActivity(caseData, recipients.length);

    return { success: true };
  } catch (error) {
    console.error('Error in notifyNewCase:', error);
    return { success: false, error: 'Unexpected error sending notifications' };
  }
}

/**
 * Log notification activity for audit trail
 */
async function logNotificationActivity(caseData: CaseNotification, recipientCount: number) {
  try {
    await (supabase as any)
      .from('case_history')
      .insert({
        case_id: caseData.case_id,
        action: 'notifications_sent',
        description: `Automatic notifications sent to ${recipientCount} user(s) (Secretary, Director Legal, Manager Legal) for commentary and input`,
        performed_by: caseData.created_by,
        metadata: {
          notification_type: 'case_created',
          recipient_count: recipientCount,
          recipient_roles: CASE_CREATION_RECIPIENTS.map(r => r.role)
        }
      });
  } catch (error) {
    console.error('Error logging notification activity:', error);
    // Don't fail the main operation if logging fails
  }
}

/**
 * Create a comment/input record for a case
 */
export async function addCaseComment(params: {
  case_id: string;
  user_id: string;
  comment: string;
  comment_type: 'commentary' | 'advice' | 'input' | 'general';
  is_private?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from('case_comments')
      .insert({
        case_id: params.case_id,
        user_id: params.user_id,
        comment: params.comment,
        comment_type: params.comment_type,
        is_private: params.is_private || false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: 'Failed to add comment' };
    }

    // Notify the case creator about the new comment
    await notifyCommentAdded(params.case_id, params.user_id);

    return { success: true };
  } catch (error) {
    console.error('Error in addCaseComment:', error);
    return { success: false, error: 'Unexpected error adding comment' };
  }
}

/**
 * Notify case creator when someone adds a comment
 */
async function notifyCommentAdded(case_id: string, commenter_id: string) {
  try {
    // Get case details and creator
    const { data: caseData } = await (supabase as any)
      .from('cases')
      .select('case_number, title, created_by')
      .eq('id', case_id)
      .single();

    if (!caseData || caseData.created_by === commenter_id) {
      return; // Don't notify if commenter is the creator
    }

    // Get commenter name
    const { data: commenter } = await (supabase as any)
      .from('profiles')
      .select('full_name, role')
      .eq('id', commenter_id)
      .single();

    // Create notification for case creator
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: caseData.created_by,
        case_id: case_id,
        title: 'New Comment on Your Case',
        message: `${commenter?.full_name || 'A user'} has provided input on case "${caseData.title}" (${caseData.case_number})`,
        type: 'comment_added',
        priority: 'medium',
        read: false,
        action_url: `/cases/${case_id}`,
        metadata: {
          case_id,
          commenter_id,
          commenter_name: commenter?.full_name,
          commenter_role: commenter?.role
        }
      });
  } catch (error) {
    console.error('Error notifying about comment:', error);
  }
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string, unreadOnly: boolean = false) {
  try {
    let query = (supabase as any)
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], error: 'Failed to fetch notifications' };
    }

    return { notifications: data || [], error: null };
  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return { notifications: [], error: 'Unexpected error' };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await (supabase as any)
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return { success: false };
  }
}

/**
 * Get case comments with user details
 */
export async function getCaseComments(caseId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from('case_comments')
      .select(`
        *,
        user:profiles(full_name, role, email)
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return { comments: [], error: 'Failed to fetch comments' };
    }

    return { comments: data || [], error: null };
  } catch (error) {
    console.error('Error in getCaseComments:', error);
    return { comments: [], error: 'Unexpected error' };
  }
}

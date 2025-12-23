# 📧 Case Alerts & Notifications System - Complete Guide

## Overview

An automatic alert system has been implemented that sends notifications to key personnel when new cases are created. This system enables Secretary, Director Legal, and Manager Legal to provide timely commentary, advice, and input on cases.

---

## 🎯 Key Features

### ✅ Automatic Alerts
- **Triggers**: Automatically when a case is created
- **Recipients**: Secretary, Director Legal, Manager Legal
- **Purpose**: Request commentary, advice, and input
- **Priority**: High (requires action)

### ✅ Notification System
- Real-time alerts for users
- Multiple notification types
- Priority levels (Low, Medium, High, Urgent)
- Read/unread tracking
- Action required flags

### ✅ Comments & Input
- Multiple comment types (Commentary, Advice, Input, General)
- Private comments option
- User role badges
- Timestamp tracking
- Edit history

---

## 📋 How It Works

### Step 1: Case Created
When someone creates a new case through `/cases/create-minimal`:

1. **Case Record Created** in database
2. **Automatic Notifications Sent** to:
   - All users with role: `secretary`
   - All users with role: `director_legal`
   - All users with role: `manager_legal`
3. **Success Message** shows:
   ```
   Case DLPP-2024-XXXXXX created successfully
   📧 Alerts sent to Secretary, Director Legal, and Manager Legal
   ```

### Step 2: Recipients Receive Alerts
Each recipient receives a notification with:
- **Title**: "New Case Created - Input Required"
- **Message**: Details about the case and who created it
- **Priority**: High
- **Action Required**: Yes
- **Link**: Direct link to the case page

### Step 3: Recipients Provide Input
Recipients can:
1. Click notification to view case
2. Read case details
3. Add their commentary, advice, or input
4. Choose comment type and privacy level
5. Submit comment

### Step 4: Creator Notified
When someone adds a comment:
1. **Case Creator** receives a notification
2. Notification includes commenter name and role
3. Link to view the comment

---

## 🔧 Technical Implementation

### Database Tables

#### 1. Notifications Table
```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID,                    -- Recipient
  case_id UUID,                    -- Related case
  title TEXT,                      -- Notification title
  message TEXT,                    -- Notification message
  type TEXT,                       -- Notification type
  priority TEXT,                   -- Low/Medium/High/Urgent
  read BOOLEAN,                    -- Read status
  read_at TIMESTAMP,               -- When read
  action_required BOOLEAN,         -- Requires action
  action_url TEXT,                 -- Link to take action
  metadata JSONB,                  -- Additional data
  created_at TIMESTAMP,
  expires_at TIMESTAMP
)
```

#### 2. Case Comments Table
```sql
case_comments (
  id UUID PRIMARY KEY,
  case_id UUID,                    -- Related case
  user_id UUID,                    -- Commenter
  comment TEXT,                    -- Comment text
  comment_type TEXT,               -- commentary/advice/input/general
  is_private BOOLEAN,              -- Private visibility
  parent_comment_id UUID,          -- For threading
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  edited BOOLEAN
)
```

### Notification Types

| Type | Description | Priority | Action Required |
|------|-------------|----------|-----------------|
| `case_created` | New case needs input | High | Yes |
| `comment_added` | Someone commented | Medium | No |
| `case_updated` | Case details changed | Medium | No |
| `task_assigned` | Task assigned to you | High | Yes |
| `deadline_approaching` | Deadline coming up | Urgent | Yes |
| `status_changed` | Case status updated | Medium | No |

### Comment Types

| Type | Icon | Description | Use Case |
|------|------|-------------|----------|
| **Commentary** | 💬 | General observations | Analysis, thoughts |
| **Advice** | 💡 | Expert recommendations | Legal advice, guidance |
| **Input** | 📝 | Specific feedback | Decisions, approvals |
| **General** | 📋 | Other comments | Questions, notes |

---

## 👥 Recipient Roles

### Who Gets Notified

The system sends alerts to users with these specific roles:

1. **Secretary** (`role: 'secretary'`)
   - Administrative support
   - Coordination duties
   - Document management

2. **Director Legal** (`role: 'director_legal'`)
   - Legal oversight
   - Strategic direction
   - Final approvals

3. **Manager Legal** (`role: 'manager_legal'`)
   - Case management
   - Legal operations
   - Team coordination

### Setting User Roles

Roles are set in the `profiles` table:

```sql
UPDATE profiles
SET role = 'director_legal'
WHERE email = 'director@lands.gov.pg';
```

Or through User Management in Admin:
- Go to `/admin/users`
- Edit user
- Assign appropriate role

---

## 📱 Using the System

### For Case Creators

**Creating a Case:**
1. Go to `/cases/create-minimal`
2. Fill in case details
3. Click "Create Case & Generate Case ID"
4. Watch for success message confirming alerts sent
5. Case is created and notifications are sent automatically

**What You See:**
```
✅ Case DLPP-2024-123456 created successfully
📧 Alerts sent to Secretary, Director Legal, and Manager Legal
```

### For Recipients (Secretary, Director Legal, Manager Legal)

**Receiving Notifications:**
1. Login to system
2. Click **Notifications** icon (bell icon)
3. See unread notifications count
4. Click notification to view case

**Providing Input:**
1. Click notification → Go to case page
2. Scroll to **Comments & Input** section
3. Choose comment type:
   - Commentary
   - Advice
   - Input
   - General
4. Enter your comment
5. Optional: Check "Private comment"
6. Click "Submit Comment"

**Comment Visibility:**
- **Public**: Visible to all users who can view the case
- **Private**: Visible only to case creator and administrators

---

## 🎨 User Interface

### Notification Component (To Be Added to Case Page)

```tsx
import { CaseCommentsSection } from '@/components/forms/CaseCommentsSection';

// In your case details page:
<CaseCommentsSection
  caseId={caseData.id}
  caseNumber={caseData.case_number}
/>
```

### Comment Card Display

Each comment shows:
- **User Name** (bold)
- **Role Badge** (colored)
- **Comment Type Badge** (Commentary/Advice/Input)
- **Private Badge** (if private)
- **Timestamp** (relative time, e.g., "2 hours ago")
- **Comment Text** (formatted)
- **Your Comment** indicator (for own comments)

### Visual Design

**Role Badges:**
- 🟨 Secretary (Amber)
- 🟥 Director Legal (Red)
- 🟪 Manager Legal (Purple)
- 🟩 Lawyer (Emerald)
- ⬜ Admin (Red)

**Comment Type Badges:**
- 🔵 Commentary (Blue)
- 🟢 Advice (Emerald)
- 🟣 Input (Purple)
- ⬜ General (Slate)

---

## 🔒 Security & Privacy

### Row Level Security (RLS)

**Notifications:**
- Users can only view their own notifications
- Users can mark their notifications as read
- Users can delete their notifications
- System can create notifications

**Comments:**
- Public comments: Visible to all case viewers
- Private comments: Visible only to:
  - Comment author
  - Case creator
  - System administrators
- Users can edit/delete own comments
- Edit history tracked

### Data Privacy

**Metadata Stored:**
```json
{
  "case_id": "uuid",
  "case_number": "DLPP-2024-123456",
  "case_title": "Land Dispute Case",
  "case_type": "dispute",
  "created_by": "uuid",
  "created_by_name": "John Doe",
  "recipient_role": "director_legal",
  "requires_input": true
}
```

---

## 📊 Notification Statistics

### Views Available

**User Notification Summary:**
```sql
SELECT * FROM user_notification_summary;
```

Shows per user:
- `unread_count` - Unread notifications
- `urgent_count` - Urgent unread
- `high_priority_count` - High priority unread
- `action_required_count` - Action required
- `total_count` - All notifications
- `latest_notification_at` - Most recent

**Case Comment Summary:**
```sql
SELECT * FROM case_comment_summary;
```

Shows per case:
- `total_comments` - All comments
- `commentary_count` - Commentary type
- `advice_count` - Advice type
- `input_count` - Input type
- `private_count` - Private comments
- `latest_comment_at` - Most recent

---

## 🛠️ Setup Instructions

### 1. Create Database Tables

Run this SQL in Supabase SQL Editor:

```bash
database-notifications-comments-schema.sql
```

This creates:
- ✅ `notifications` table with RLS policies
- ✅ `case_comments` table with RLS policies
- ✅ Summary views
- ✅ Automatic cleanup triggers
- ✅ Timestamp update functions

### 2. Set User Roles

Ensure these roles exist in your `profiles` table:

```sql
-- Update existing users or create new ones
UPDATE profiles SET role = 'secretary' WHERE email = 'secretary@lands.gov.pg';
UPDATE profiles SET role = 'director_legal' WHERE email = 'director@lands.gov.pg';
UPDATE profiles SET role = 'manager_legal' WHERE email = 'manager@lands.gov.pg';
```

### 3. Test the System

**Create a Test Case:**
1. Login as any user
2. Navigate to `/cases/create-minimal`
3. Create a new case
4. Verify success message shows alert notification

**Check Notifications:**
1. Login as Secretary, Director Legal, or Manager Legal
2. Check notifications (if notification UI is implemented)
3. Or query database:
```sql
SELECT * FROM notifications
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;
```

**Add a Comment:**
1. Go to case details page
2. Add CaseCommentsSection component
3. Provide commentary/advice/input
4. Verify comment appears in list

---

## 📈 Usage Examples

### Example 1: New Land Dispute Case

**Scenario:** Registry clerk creates a land dispute case

**What Happens:**
1. Case created: `DLPP-2024-789012`
2. Notifications sent to:
   - Jane Smith (Secretary)
   - Robert Brown (Director Legal)
   - Mary Johnson (Manager Legal)
3. Each receives:
   ```
   Title: New Case Created - Input Required
   Message: A new case "Land Dispute - Portion 123" (DLPP-2024-789012)
            has been created by John Clerk. Your commentary, advice,
            and input are requested.
   Priority: High
   Action: Required
   ```

**Recipients' Actions:**
- Jane (Secretary): Adds commentary on procedural steps
- Robert (Director Legal): Provides legal advice on jurisdiction
- Mary (Manager Legal): Adds input on resource allocation

### Example 2: Private Legal Advice

**Scenario:** Director Legal provides confidential advice

**What Happens:**
1. Director opens case DLPP-2024-789012
2. Adds comment with:
   - Type: Advice
   - Private: ✅ Checked
   - Content: "This case may involve constitutional issues..."
3. Comment visible only to:
   - Director Legal (author)
   - Case creator
   - System administrators

### Example 3: Threading Discussions

**Scenario:** Multiple stakeholders discuss a case

**Timeline:**
- **10:00 AM** - Case created, notifications sent
- **10:30 AM** - Secretary adds commentary on documents needed
- **11:00 AM** - Manager Legal provides input on timeline
- **02:00 PM** - Director Legal adds advice on legal strategy
- **03:00 PM** - Case creator responds to all comments
- **03:30 PM** - All commenters receive notification of response

---

## 🔄 Workflow Diagram

```
┌─────────────────────┐
│  Case Created       │
│  (Any User)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Auto-Notify        │
│  • Secretary        │
│  • Director Legal   │
│  • Manager Legal    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Recipients         │
│  Receive Alerts     │
│  (High Priority)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Provide Input      │
│  • Commentary       │
│  • Advice           │
│  • Input            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Creator Notified   │
│  of New Comments    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Discussion         │
│  Continues          │
└─────────────────────┘
```

---

## 🎯 Best Practices

### For Case Creators
✅ **DO:**
- Create cases with complete information
- Monitor notifications for responses
- Respond to comments promptly
- Acknowledge advice and input

❌ **DON'T:**
- Create duplicate cases
- Ignore comments from senior staff
- Delete important comments
- Over-use private comments

### For Recipients (Secretary/Directors/Managers)
✅ **DO:**
- Respond to notifications within 24 hours
- Use appropriate comment type
- Be specific and actionable
- Use private comments for sensitive info
- Acknowledge when input is provided

❌ **DON'T:**
- Mark notifications as read without reviewing
- Provide vague or unclear advice
- Miss urgent notifications
- Duplicate others' comments

### For Administrators
✅ **DO:**
- Monitor notification delivery
- Review comment patterns
- Clean up old notifications
- Maintain user roles correctly
- Test notification system regularly

❌ **DON'T:**
- Delete all notifications (keep audit trail)
- Change notification logic without testing
- Ignore failed notification alerts

---

## 🐛 Troubleshooting

### Issue 1: Notifications Not Sent

**Symptoms:** Success message shows but no notifications created

**Causes:**
- No users with required roles
- Database connection error
- RLS policy blocking inserts

**Solutions:**
1. Check user roles:
```sql
SELECT email, role FROM profiles
WHERE role IN ('secretary', 'director_legal', 'manager_legal');
```

2. Verify notifications table:
```sql
SELECT * FROM notifications
WHERE case_id = 'your-case-id';
```

3. Check browser console for errors

### Issue 2: Recipients Not Seeing Notifications

**Symptoms:** Notifications created but users don't see them

**Causes:**
- RLS policy issue
- User not logged in
- Notification UI not implemented

**Solutions:**
1. Verify RLS policies are enabled
2. Check user authentication
3. Query directly:
```sql
SELECT * FROM notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### Issue 3: Comments Not Saving

**Symptoms:** Error when submitting comments

**Causes:**
- Invalid case_id
- User not authenticated
- Database constraint violation

**Solutions:**
1. Verify case exists:
```sql
SELECT id FROM cases WHERE id = 'case-id';
```

2. Check user session:
```sql
SELECT auth.uid();
```

3. Review error message in console

---

## 📞 Support & Resources

### Documentation Files
- `database-notifications-comments-schema.sql` - Database schema
- `src/lib/notification-utils.ts` - Notification functions
- `src/components/forms/CaseCommentsSection.tsx` - UI component

### Database Queries
- Check notifications: `SELECT * FROM notifications`
- Check comments: `SELECT * FROM case_comments`
- View summaries: `SELECT * FROM user_notification_summary`

### Integration Points
- Case creation: `src/app/cases/create-minimal/page.tsx`
- Notification system: `src/lib/notification-utils.ts`
- Comments UI: `src/components/forms/CaseCommentsSection.tsx`

---

## 🚀 Future Enhancements

### Planned Features
1. **Email Notifications**
   - Send email alerts in addition to in-app
   - Configurable email preferences
   - Daily digest option

2. **SMS Alerts**
   - Critical notifications via SMS
   - Phone number configuration
   - Opt-in/opt-out

3. **Notification Preferences**
   - User-configurable settings
   - Choose which types to receive
   - Quiet hours

4. **Advanced Threading**
   - Reply to specific comments
   - Conversation threads
   - Mention users (@username)

5. **Rich Text Comments**
   - Markdown support
   - File attachments
   - Formatting options

---

**System:** DLPP Legal Case Management
**Module:** Automatic Alerts & Notifications
**Version:** 1.0
**Status:** ✅ Implemented and Ready
**Last Updated:** December 14, 2024

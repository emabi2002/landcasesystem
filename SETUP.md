# DLPP Legal Case Management System - Setup Guide

## Overview
This is a comprehensive Legal Case Management System built for the Department of Lands & Physical Planning (DLPP). The system helps manage legal cases, documents, tasks, events, and land information.

## Technologies Used
- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Date Management**: date-fns
- **Charts**: Recharts
- **Maps**: React Leaflet

## Prerequisites
- Node.js 18+ or Bun
- Supabase account (already set up)
- Modern web browser

## Setup Instructions

### Step 1: Database Setup

1. **Log in to Supabase**
   - Go to https://supabase.com
   - Log in with your credentials
   - Navigate to your project: `yvnkyjnwvylrweyzvibs`

2. **Run the Database Schema**
   - In Supabase, go to the SQL Editor (left sidebar)
   - Open the file `database-schema.sql` from this project
   - Copy all the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" to execute the schema
   - This will create all necessary tables, indexes, and security policies

3. **Create Admin User**
   - In Supabase, go to Authentication > Users
   - Click "Add user" > "Create new user"
   - Enter:
     - Email: `admin@lands.gov.pg`
     - Password: `demo123`
     - Confirm password: `demo123`
   - Click "Create user"
   - Copy the user ID (UUID) that was generated

4. **Link User to Profile**
   - Go back to SQL Editor
   - Run this query (replace YOUR_USER_ID with the UUID you copied):
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role)
   VALUES ('YOUR_USER_ID', 'admin@lands.gov.pg', 'System Administrator', 'admin');
   ```

### Step 2: Environment Setup

The environment variables are already configured in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://yvnkyjnwvylrweyzvibs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 3: Install Dependencies & Run

The dependencies are already installed. To run the development server:

```bash
cd dlpp-legal-cms
bun run dev
```

The application will be available at http://localhost:3000

### Step 4: Login

1. Open http://localhost:3000
2. You'll be redirected to the login page
3. Enter:
   - Email: `admin@lands.gov.pg`
   - Password: `demo123`
4. Click "Sign In"

## Features

### 1. Dashboard
- Overview of all cases and statistics
- Quick access to recent cases and upcoming events
- Summary cards showing open/closed cases and overdue tasks

### 2. Case Management
- Register new legal cases with case numbers
- Track case status (Under Review, In Court, Mediation, etc.)
- Assign cases to officers
- Link multiple parties to each case
- Add documents, evidence, and attachments
- Create tasks and assign responsibilities
- Schedule events and hearings
- Link land parcels to cases
- View complete case history timeline

### 3. Calendar
- View all events, hearings, and deadlines
- Monthly calendar view with event indicators
- Filter by event type
- See events by selected date

### 4. Tasks
- Create and assign tasks
- Track task status (Pending, In Progress, Completed, Overdue)
- Filter tasks by status
- Set due dates and priorities
- Link tasks to specific cases

### 5. Documents (Coming Soon)
- Upload and manage case documents
- Support for PDFs, Word files, images, videos, audio
- Version control for documents
- Search and filter documents

### 6. Land Parcels (Coming Soon)
- Link land parcels to cases
- Interactive GIS mapping
- View parcel boundaries and coordinates
- Attach survey plans

### 7. Reports (Coming Soon)
- Generate case reports
- Export to PDF/Excel
- Filter by region, type, date range
- Analytics and visualizations

## Database Structure

### Main Tables:
- **profiles**: User accounts and roles
- **cases**: Legal case information
- **parties**: Individuals/entities involved in cases
- **documents**: Case files and attachments
- **tasks**: Assignments and action items
- **events**: Hearings, deadlines, meetings
- **land_parcels**: Land information linked to cases
- **case_history**: Audit trail of all case changes
- **evidence**: Photos, videos, audio recordings
- **notifications**: System alerts and reminders

## User Roles

- **Admin**: Full system access
- **Legal Officer**: Manage cases, documents, tasks
- **Registrar**: Register and manage cases
- **Survey Officer**: Manage land parcels and GIS data
- **Director**: View reports and analytics
- **Auditor**: Read-only access for auditing

## Security Features

- Row Level Security (RLS) enabled on all tables
- Authentication required for all operations
- Audit logging for all case changes
- Secure file storage with Supabase Storage
- Role-based access control

## Next Steps

### Immediate:
1. Set up the database using the SQL schema
2. Create the admin user
3. Log in and explore the system
4. Create your first case

### Future Enhancements:
1. **Document Upload**: Implement file upload to Supabase Storage
2. **GIS Integration**: Add interactive maps with Leaflet
3. **Email Notifications**: Send alerts for deadlines and events
4. **SMS Reminders**: Integrate SMS for important notifications
5. **Offline Mode**: Enable offline data capture for field officers
6. **Mobile App**: Build mobile version for field access
7. **Advanced Reporting**: Add more report types and exports
8. **Court System Integration**: Connect to court scheduling systems

## Support

For technical support or questions:
- Email: support@same.new (for Same platform issues)
- Internal: Contact your IT department for system-specific questions

## Deployment

When ready to deploy to production:
1. Update environment variables for production
2. Set up production Supabase project
3. Run database migrations
4. Deploy to Netlify or Vercel
5. Configure custom domain
6. Set up SSL certificates
7. Enable backups and monitoring

## License & Usage

This system is proprietary to the Department of Lands & Physical Planning, Papua New Guinea.
Unauthorized use, distribution, or modification is prohibited.

---

**Version**: 1.0.0
**Last Updated**: October 29, 2025
**Built with**: Same.new AI Development Platform

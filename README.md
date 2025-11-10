# DLPP Legal Case Management System

A comprehensive Legal Case Management System built for the **Department of Lands & Physical Planning (DLPP)**, Papua New Guinea.

[![GitHub](https://img.shields.io/badge/GitHub-landcasesystem-blue?logo=github)](https://github.com/emabi2002/landcasesystem)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## Overview

This system provides complete management of legal cases, including:
- Case registration and tracking
- Document management
- Task assignment and monitoring
- Calendar with events and deadlines
- Land parcel linking with GIS support
- Comprehensive reporting and analytics

**Design**: Fully branded with DLPP colors and design language to match the official DLPP website.

## 📚 Documentation Index

**Start here based on what you need:**

| Task | Guide | Time |
|------|-------|------|
| 🗄️ **Set up database** | [DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md) | 15 min |
| 📊 **Load sample data (SQL)** | [LOAD_SAMPLE_DATA.md](LOAD_SAMPLE_DATA.md) | 5 min |
| 📝 **Case entry workflow** | [CASE_ENTRY_WORKFLOW.md](CASE_ENTRY_WORKFLOW.md) | **← START HERE** |
| ✍️ **Manual data entry** | [MANUAL_DATA_ENTRY_GUIDE.md](MANUAL_DATA_ENTRY_GUIDE.md) | 20 min - 3 hrs |
| 📋 **Quick entry reference** | [QUICK_ENTRY_REFERENCE.md](QUICK_ENTRY_REFERENCE.md) | 20 min |
| 🚀 **Quick overview** | [QUICK_START.md](QUICK_START.md) | 5 min read |
| ✅ **Verify data loaded** | Run [verify-sample-data.sql](verify-sample-data.sql) | 1 min |
| 📖 **Sample data details** | [SAMPLE_DATA_README.md](SAMPLE_DATA_README.md) | Reference |
| 🌐 **Deploy to production** | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | 2-4 hours |
| 🛠️ **Technical setup** | [SETUP.md](SETUP.md) | Reference |
| ❓ **This file** | README.md | You are here |

---

## ⚠️ URGENT: Fix "Row-Level Security Policy" Error

If you see **"new row violates row-level security policy"** when uploading documents or adding data:

👉 **[FIX_RLS_POLICIES.md](FIX_RLS_POLICIES.md)** - Run the SQL script to fix this immediately

This is a one-time setup required for Supabase security policies.

---

## 👥 How to Add Parties to a Case

**Parties are individuals or entities involved in a case (plaintiffs, defendants, witnesses, legal representatives, etc.)**

### Quick Answer:
1. Open a case detail page
2. Click the **"Parties"** tab
3. Click the **"Add Party"** button (red button, top right)
4. Fill in the party details and submit

### Detailed Guide:
For a complete step-by-step guide with examples, see **[CASE_ENTRY_WORKFLOW.md](CASE_ENTRY_WORKFLOW.md)** - Section "Step 2: Add Parties Involved"

### What You Can Enter:
- Party name (required)
- Party type: Individual, Organization, Government Agency, Clan/Community, Other
- Role: Plaintiff, Defendant, Witness, Legal Representative, Third Party, Other
- Contact information (phone, email, address)

### Where to Find It:
- **Method 1:** Case Detail Page → Parties Tab → Add Party Button
- **Method 2:** Case Detail Page → Overview Tab → Parties Involved Card → Add First Party

---

## 🚀 Quick Start

### Prerequisites

Before you begin, you'll need:
- **Node.js 18+** or **Bun** installed
- **Supabase account** (free tier works)
- **Git** installed

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/emabi2002/landcasesystem.git
cd landcasesystem
```

#### 2. Install Dependencies

```bash
# Using bun (recommended)
bun install

# OR using npm
npm install
```

#### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

To get your Supabase credentials:
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → API
3. Copy the "Project URL" and "anon/public" key

### 1. Database Setup (IMPORTANT - Do This First!)

You **MUST** set up the database before the application will work.

👉 **Follow**: [DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md)

Quick steps:

#### Step 1: Access Supabase
1. Go to https://supabase.com
2. Sign in to your account
3. Navigate to your project: `yvnkyjnwvylrweyzvibs`

#### Step 2: Create Database Tables
1. In your Supabase dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `database-schema.sql` from this project
4. Copy **ALL** the SQL code (it's quite long, make sure you get everything!)
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** or press Ctrl/Cmd + Enter
7. Wait for the query to complete (you should see "Success" message)

This will create:
- 10 database tables (cases, parties, documents, tasks, events, land_parcels, etc.)
- All indexes for performance
- Row Level Security (RLS) policies
- Automatic triggers and functions

#### Step 3: Create Your Admin User
1. In Supabase, go to **"Authentication"** > **"Users"** (left sidebar)
2. Click **"Add user"** > **"Create new user"**
3. Enter:
   - Email: `admin@lands.gov.pg`
   - Password: `demo123`
   - Confirm: `demo123`
4. Click **"Create user"**
5. **IMPORTANT**: Copy the User ID (UUID) that appears - it looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### Step 4: Link User to Profile Table
1. Go back to **"SQL Editor"**
2. Create a new query
3. Paste this code (replace YOUR_USER_ID with the UUID you copied):

```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('YOUR_USER_ID', 'admin@lands.gov.pg', 'System Administrator', 'admin');
```

4. Click **"Run"**
5. You should see "Success. No rows returned"

### 2. Run the Application

Start the development server:

```bash
# Using bun (recommended)
bun run dev

# OR using npm
npm run dev
```

Then open your browser to [http://localhost:3000](http://localhost:3000)

**Login credentials** (after database setup):
- Email: `admin@lands.gov.pg`
- Password: `demo123`

You should be logged in and see the dashboard!

## 📁 Project Structure

```
dlpp-legal-cms/
├── src/
│   ├── app/
│   │   ├── login/          # Login page
│   │   ├── dashboard/      # Main dashboard
│   │   ├── cases/          # Case management
│   │   ├── calendar/       # Events and hearings
│   │   ├── tasks/          # Task management
│   │   ├── documents/      # Document management
│   │   ├── land-parcels/   # GIS and land info
│   │   └── reports/        # Reports and analytics
│   ├── components/
│   │   ├── layout/         # Navigation components
│   │   └── ui/             # shadcn/ui components
│   └── lib/
│       ├── supabase.ts     # Supabase client
│       └── utils.ts        # Utility functions
├── database-schema.sql     # Database schema
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## 🎯 Features

### ✅ Implemented
- **Authentication**: Secure login with Supabase Auth
- **Dashboard**: Statistics, recent cases, upcoming events
- **Case Management**:
  - Register new cases with case numbers
  - View all cases with search and filters
  - Detailed case view with tabs
  - Track case status and history
- **Calendar**: View events by month, filter by date
- **Tasks**: Task list with status tracking and filtering
- **Navigation**: Clean, responsive navigation bar
- **Database**: Complete schema with 10 tables and security

### 🔄 In Progress
- Document upload functionality
- Interactive GIS maps with Leaflet
- Task and event creation forms
- Party management forms
- Real-time notifications

### 📋 Planned
- Report generation and export (PDF, Excel)
- Email and SMS notifications
- Offline mode for field officers
- Mobile app
- Court system integration

## 🛠️ Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Maps**: React Leaflet (ready to integrate)
- **Charts**: Recharts
- **Date**: date-fns
- **Package Manager**: Bun

## 📊 Database Tables

1. **profiles** - User accounts and roles
2. **cases** - Legal case information
3. **parties** - Individuals/entities in cases
4. **documents** - Case files and attachments
5. **tasks** - Assignments and action items
6. **events** - Hearings, deadlines, meetings
7. **land_parcels** - Land information
8. **case_history** - Audit trail
9. **evidence** - Photos, videos, audio
10. **notifications** - System alerts

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Authentication required for all pages
- Role-based access control
- Audit logging on case changes
- Secure password hashing
- HTTPS enforced

## 👥 User Roles

- **admin** - Full system access
- **legal_officer** - Manage cases and tasks
- **registrar** - Register cases
- **survey_officer** - Manage land parcels
- **director** - View reports
- **auditor** - Read-only access

## 🔍 Testing the System

After setting up the database and logging in:

1. **Create a Test Case**:
   - Click "Register New Case" on the dashboard
   - Fill in the form (case number, title, description)
   - Click "Register Case"

2. **View Cases**:
   - Click "Cases" in the navigation
   - Use search and filters
   - Click on a case to view details

3. **Explore Features**:
   - Navigate through different sections
   - Check the calendar
   - View tasks

## 📝 Important Notes

1. **Database Setup is Required**: The app won't work until you run the database schema
2. **User Creation**: You must create the user in Supabase Auth AND link it to the profiles table
3. **Environment Variables**: Already configured in `.env.local`
4. **Development Mode**: Currently running in development mode

## 🐛 Troubleshooting

### "Failed to login"
- Make sure you created the user in Supabase Auth
- Verify the email and password are correct
- Check that you linked the user to the profiles table

### "No cases found"
- This is normal on first login
- Click "Register New Case" to create your first case

### Database errors
- Verify you ran the complete `database-schema.sql`
- Check Supabase dashboard for any error messages
- Make sure RLS policies are enabled

## 🚀 Deployment

Ready to deploy to production? See the comprehensive [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

Quick deployment options:
- **Netlify** (Recommended) - Follow the guide for step-by-step instructions
- **Vercel** - Next.js optimized hosting
- **Custom server** - Self-hosted option

**Important**:
- Create a separate production Supabase project
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Set environment variables in your hosting platform
- Enable HTTPS/SSL (automatic with Netlify/Vercel)

## 📞 Support

For technical issues:
- Same platform: support@same.new
- Internal IT: Contact your department's IT team

## 📄 License

Proprietary - Department of Lands & Physical Planning, Papua New Guinea

---

**Built with** ❤️ **using Same.new AI Development Platform**

**Version**: 2.0.0
**Last Updated**: October 29, 2025

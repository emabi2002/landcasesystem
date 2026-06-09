-- DLPP Legal Case Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'legal_officer', 'registrar', 'survey_officer', 'director', 'auditor')) DEFAULT 'legal_officer',
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('under_review', 'in_court', 'mediation', 'tribunal', 'judgment', 'closed', 'settled')) DEFAULT 'under_review',
  case_type TEXT CHECK (case_type IN ('dispute', 'court_matter', 'title_claim', 'administrative_review', 'other')) DEFAULT 'other',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  region TEXT,
  assigned_officer_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Parties involved in cases
CREATE TABLE IF NOT EXISTS public.parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  party_type TEXT CHECK (party_type IN ('individual', 'company', 'government_entity', 'other')) DEFAULT 'individual',
  role TEXT CHECK (role IN ('plaintiff', 'defendant', 'witness', 'other')) DEFAULT 'other',
  contact_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  document_type TEXT CHECK (document_type IN ('filing', 'affidavit', 'correspondence', 'survey_report', 'contract', 'evidence', 'other')) DEFAULT 'other',
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  version INTEGER DEFAULT 1
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Events (hearings, filings, deadlines)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT CHECK (event_type IN ('hearing', 'filing_deadline', 'response_deadline', 'meeting', 'other')) DEFAULT 'other',
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Land Parcels
CREATE TABLE IF NOT EXISTS public.land_parcels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  parcel_number TEXT NOT NULL,
  location TEXT,
  coordinates JSONB,
  area_sqm DECIMAL,
  survey_plan_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Case Timeline/History
CREATE TABLE IF NOT EXISTS public.case_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Evidence (photos, videos, audio)
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('photo', 'video', 'audio', 'other')) DEFAULT 'other',
  captured_at TIMESTAMP WITH TIME ZONE,
  gps_location JSONB,
  captured_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('deadline', 'task', 'event', 'case_update', 'other')) DEFAULT 'other',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_officer ON public.cases(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for authenticated users)
-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Cases (all authenticated users can view and manage)
CREATE POLICY "Authenticated users can view cases" ON public.cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cases" ON public.cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cases" ON public.cases FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete cases" ON public.cases FOR DELETE TO authenticated USING (true);

-- Parties
CREATE POLICY "Authenticated users can manage parties" ON public.parties FOR ALL TO authenticated USING (true);

-- Documents
CREATE POLICY "Authenticated users can manage documents" ON public.documents FOR ALL TO authenticated USING (true);

-- Tasks
CREATE POLICY "Authenticated users can manage tasks" ON public.tasks FOR ALL TO authenticated USING (true);

-- Events
CREATE POLICY "Authenticated users can manage events" ON public.events FOR ALL TO authenticated USING (true);

-- Land Parcels
CREATE POLICY "Authenticated users can manage land parcels" ON public.land_parcels FOR ALL TO authenticated USING (true);

-- Case History
CREATE POLICY "Authenticated users can view case history" ON public.case_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert case history" ON public.case_history FOR INSERT TO authenticated WITH CHECK (true);

-- Evidence
CREATE POLICY "Authenticated users can manage evidence" ON public.evidence FOR ALL TO authenticated USING (true);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create case history entry
CREATE OR REPLACE FUNCTION log_case_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.case_history (case_id, action, description, performed_by)
    VALUES (NEW.id, 'Case Created', 'New case registered', NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.case_history (case_id, action, description, performed_by)
      VALUES (NEW.id, 'Status Changed', 'Status changed from ' || OLD.status || ' to ' || NEW.status, auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log case history
CREATE TRIGGER case_history_trigger AFTER INSERT OR UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION log_case_history();

-- Create default admin user profile (this will be linked to the auth user)
-- You'll need to run this after creating the user in Supabase Auth
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES ('YOUR_USER_ID_HERE', 'admin@lands.gov.pg', 'System Administrator', 'admin');

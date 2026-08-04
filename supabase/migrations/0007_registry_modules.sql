-- 0007_registry_modules.sql
-- Purpose: Canonical registry, correspondence, intake, filings, compliance and register tables.
-- Dependencies: 0001, 0004
-- Safety: Forward-only. Additive. No destructive operations.

create table if not exists public.incoming_correspondence (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null,
  document_type text not null,
  source text not null,
  received_date timestamptz not null default timezone('utc', now()),
  received_by uuid references public.profiles(id) on delete set null,
  subject text not null,
  description text,
  file_url text,
  acknowledgement_sent boolean not null default false,
  acknowledgement_date timestamptz,
  acknowledgement_number text,
  case_id uuid references public.cases(id) on delete set null,
  status text not null default 'received',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists incoming_correspondence_reference_key on public.incoming_correspondence (reference_number);

drop trigger if exists trg_incoming_correspondence_updated_at on public.incoming_correspondence;
create trigger trg_incoming_correspondence_updated_at before update on public.incoming_correspondence
for each row execute function public.set_updated_at();

create table if not exists public.case_intake_records (
  id uuid primary key default gen_random_uuid(),
  internal_serial_number text not null,
  document_type text not null,
  source text,
  from_party_type text,
  from_office_name text,
  from_contact_person text,
  delivered_by_name text,
  delivered_by_contact text,
  physical_folder_number text,
  physical_location text default 'Reception Desk',
  date_stamped timestamptz not null default timezone('utc', now()),
  received_date timestamptz not null default timezone('utc', now()),
  received_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  notes text,
  urgent boolean not null default false,
  status text not null default 'received',
  case_id uuid references public.cases(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists case_intake_records_serial_key on public.case_intake_records (internal_serial_number);

drop trigger if exists trg_case_intake_records_updated_at on public.case_intake_records;
create trigger trg_case_intake_records_updated_at before update on public.case_intake_records
for each row execute function public.set_updated_at();

create table if not exists public.case_intake_documents (
  id uuid primary key default gen_random_uuid(),
  intake_record_id uuid not null references public.case_intake_records(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default timezone('utc', now())
);
create index if not exists case_intake_documents_record_idx on public.case_intake_documents (intake_record_id);

create table if not exists public.directions (
  id uuid primary key default gen_random_uuid(),
  direction_number text not null,
  source text not null,
  issued_by uuid references public.profiles(id) on delete set null,
  issued_date timestamptz not null default timezone('utc', now()),
  subject text not null,
  content text not null,
  priority text not null default 'medium',
  due_date timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'open',
  case_id uuid references public.cases(id) on delete set null,
  completed_date timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create unique index if not exists directions_number_key on public.directions (direction_number);

drop trigger if exists trg_directions_updated_at on public.directions;
create trigger trg_directions_updated_at before update on public.directions
for each row execute function public.set_updated_at();

create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  communication_type text not null,
  direction text not null,
  party_type text not null,
  party_name text,
  party_id uuid,
  recipient_role text,
  subject text not null,
  content text,
  communication_date timestamptz not null default timezone('utc', now()),
  handled_by uuid references public.profiles(id) on delete set null,
  response_required boolean not null default false,
  response_deadline timestamptz,
  response_status text not null default 'none',
  attachments jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists communications_case_idx on public.communications (case_id);

create table if not exists public.file_requests (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  file_type text not null,
  file_number text,
  requested_by uuid references public.profiles(id) on delete set null,
  requested_date timestamptz not null default timezone('utc', now()),
  status text not null default 'requested',
  received_date timestamptz,
  current_location text,
  custodian text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists file_requests_case_idx on public.file_requests (case_id);

drop trigger if exists trg_file_requests_updated_at on public.file_requests;
create trigger trg_file_requests_updated_at before update on public.file_requests
for each row execute function public.set_updated_at();

create table if not exists public.filings (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  filing_type text not null,
  filing_title text,
  title text,
  filing_subtype text,
  description text,
  draft_file_url text,
  draft_uploaded_by uuid references public.profiles(id) on delete set null,
  draft_uploaded_at timestamptz,
  prepared_by uuid references public.profiles(id) on delete set null,
  prepared_date timestamptz,
  submitted_to text,
  submission_date timestamptz,
  filing_number text,
  court_filing_date timestamptz,
  status text not null default 'draft',
  status_update_date timestamptz,
  status_notes text,
  file_url text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists filings_case_idx on public.filings (case_id);
create index if not exists filings_status_idx on public.filings (status);

drop trigger if exists trg_filings_updated_at on public.filings;
create trigger trg_filings_updated_at before update on public.filings
for each row execute function public.set_updated_at();

create table if not exists public.court_orders (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  order_type text,
  order_reference text,
  order_date date,
  description text,
  issued_by text,
  compliance_deadline date,
  status text not null default 'active',
  file_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists court_orders_case_idx on public.court_orders (case_id);

drop trigger if exists trg_court_orders_updated_at on public.court_orders;
create trigger trg_court_orders_updated_at before update on public.court_orders
for each row execute function public.set_updated_at();

create table if not exists public.compliance_tracking (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  court_order_reference text,
  court_order_date date,
  court_order_description text not null,
  compliance_deadline date,
  responsible_division text not null,
  memo_reference text,
  memo_sent_date date,
  memo_sent_by uuid references public.profiles(id) on delete set null,
  compliance_status text not null default 'pending',
  completion_date date,
  compliance_notes text,
  attachments jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists compliance_tracking_case_idx on public.compliance_tracking (case_id);

drop trigger if exists trg_compliance_tracking_updated_at on public.compliance_tracking;
create trigger trg_compliance_tracking_updated_at before update on public.compliance_tracking
for each row execute function public.set_updated_at();

create table if not exists public.recommendation_links (
  id uuid primary key default gen_random_uuid(),
  legal_case_id uuid not null references public.cases(id) on delete cascade,
  recommendation_id text not null,
  link_type text not null default 'supporting_reference',
  link_context text,
  snapshot_data jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists recommendation_links_case_idx on public.recommendation_links (legal_case_id);

create table if not exists public.external_lawyers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  lawyer_type text,
  contact_email text,
  contact_phone text,
  address text,
  specialization text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_external_lawyers_updated_at on public.external_lawyers;
create trigger trg_external_lawyers_updated_at before update on public.external_lawyers
for each row execute function public.set_updated_at();

create table if not exists public.search_warrants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  warrant_number text,
  crime_report_number text,
  date_received date,
  received_from text,
  police_officer_name text,
  police_officer_rank text,
  police_contact_details text,
  received_by uuid references public.profiles(id) on delete set null,
  date_assigned_to_lawyer date,
  dlpp_lawyer_in_carriage text,
  applicant_informant text,
  respondent text,
  land_description text,
  legal_issue text,
  land_file_reference text,
  title_file_reference text,
  documents_to_provide text,
  witness_statement_status text,
  status text not null default 'received',
  remarks_comments text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists search_warrants_case_idx on public.search_warrants (case_id);

drop trigger if exists trg_search_warrants_updated_at on public.search_warrants;
create trigger trg_search_warrants_updated_at before update on public.search_warrants
for each row execute function public.set_updated_at();

create table if not exists public.section5_notices (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  notice_number text,
  status text not null default 'draft',
  subject text,
  details text,
  issued_date date,
  response_deadline date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists section5_notices_case_idx on public.section5_notices (case_id);

drop trigger if exists trg_section5_notices_updated_at on public.section5_notices;
create trigger trg_section5_notices_updated_at before update on public.section5_notices
for each row execute function public.set_updated_at();

create table if not exists public.section_160_applications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  application_number text,
  status text not null default 'draft',
  subject text,
  details text,
  filed_date date,
  hearing_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists section_160_applications_case_idx on public.section_160_applications (case_id);

drop trigger if exists trg_section_160_applications_updated_at on public.section_160_applications;
create trigger trg_section_160_applications_updated_at before update on public.section_160_applications
for each row execute function public.set_updated_at();

-- Validation query:
-- select
--   (select count(*) from public.filings) as filings,
--   (select count(*) from public.directions) as directions,
--   (select count(*) from public.search_warrants) as search_warrants;

-- Rollback guidance:
-- Drop child tables before parent case references. Never CASCADE drop legal registers in production.

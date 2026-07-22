-- 0006_documents_and_storage.sql
-- Purpose: Canonical documents table and private storage bucket preparation.
-- Dependencies: 0001, 0004
-- Safety: Forward-only. Storage bucket is created private. Storage policies are defined in 0011_rls_policies.sql.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  file_type text,
  file_size bigint,
  document_type text,
  storage_path text,
  search_warrant_id uuid,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default timezone('utc', now())
);
create index if not exists documents_case_idx on public.documents (case_id);
create index if not exists documents_type_idx on public.documents (document_type);

-- Register a private storage bucket for case documents.
-- This does not move existing files; it only ensures the bucket exists and is private.
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do update set public = false;

-- Validation query:
-- select id, public from storage.buckets where id = 'case-documents';

-- Rollback guidance:
-- Do not delete the storage bucket or documents table in production without a validated backup and migration plan.

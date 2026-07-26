-- 0019_secure_group_scope_rules_archive.sql
-- Purpose: Enable RLS on the RBAC scope-rule deduplication archive created during canonical RBAC migration.
-- Dependencies: 0003, 0011
-- Safety: Forward-only. The archive may contain RBAC scope history from UAT deduplication and must not be publicly readable.

alter table public.group_scope_rules_dedup_archive enable row level security;

drop policy if exists gsr_archive_admin_read on public.group_scope_rules_dedup_archive;
create policy gsr_archive_admin_read on public.group_scope_rules_dedup_archive
  for select to authenticated
  using (public.current_user_has_permission('groups', 'read'));

-- No insert/update/delete policy: archive rows are written only by migration/maintenance SQL.

-- Validation query:
-- select relrowsecurity from pg_class where relname = 'group_scope_rules_dedup_archive';

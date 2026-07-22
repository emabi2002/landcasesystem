-- 0013_realtime_configuration.sql
-- Purpose: Enable realtime only for tables the application subscribes to. RLS still applies to realtime.
-- Dependencies: 0004, 0005, 0006, 0007, 0009, 0011
-- Safety: Forward-only. Idempotent membership additions.

do $$
declare
  t text;
  rt_tables text[] := array['cases','tasks','events','documents','communications','notifications'];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array rt_tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end;
$$;

-- Validation query:
-- select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' order by tablename;

-- Rollback guidance:
-- Remove tables from the publication with ALTER PUBLICATION ... DROP TABLE during controlled rollback.

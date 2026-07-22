# Archived legacy SQL

These SQL files are historical artifacts from earlier development iterations of the Land Case Management System.

## Warning

- Do NOT execute these scripts against any production database.
- They are inconsistent with the canonical Phase 2 schema.
- Several contain destructive commands (DROP, TRUNCATE, DELETE, RLS-disabling statements).
- Some assume table/column shapes that no longer match the canonical schema.

## Canonical source of truth

The authoritative database definition lives in:

- `docs/CANONICAL_DATABASE_SCHEMA.md`
- `supabase/migrations/`

Use the ordered migrations under `supabase/migrations/` for any environment setup. Development/staging seed data lives in `supabase/seed/`.

## Why keep them

These files are retained only for historical reference and migration mapping while consolidating the schema. They must not be run.

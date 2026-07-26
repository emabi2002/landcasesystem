import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

type QueryResultRow = Record<string, unknown>;

function getDatabaseUrlFromEnvironment() {
  const envUrl = process.env.DATABASE_URL?.trim();
  if (!envUrl) {
    throw new Error('DATABASE_URL environment variable is required. Run this script through the hidden-input wrapper.');
  }
  if (!envUrl.startsWith('postgresql://') && !envUrl.startsWith('postgres://')) {
    throw new Error('Invalid DATABASE_URL format');
  }
  return envUrl;
}

function printSanitizedConnectionSummary(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  console.log('Connection target:', {
    username: decodeURIComponent(parsed.username),
    host: parsed.hostname,
    port: parsed.port || '(default)',
    database: parsed.pathname.replace(/^\//, ''),
  });
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/--.*$/, ''))
    .join('\n');
}

function scanMigrations(migrationsDir: string) {
  const files = readdirSync(migrationsDir)
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .sort();

  const unsafePatterns = [
    { name: 'DROP TABLE', regex: /\bdrop\s+table\b/i },
    { name: 'TRUNCATE', regex: /\btruncate\b/i },
    { name: 'DISABLE RLS', regex: /\bdisable\s+row\s+level\s+security\b/i },
    { name: 'DROP ... CASCADE', regex: /\bdrop\s+(table|schema|function|view|policy|trigger|type|extension)\b[^;]*\bcascade\b/i },
  ];

  const findings: string[] = [];
  for (const file of files) {
    const sql = stripSqlComments(readFileSync(join(migrationsDir, file), 'utf8'));
    for (const pattern of unsafePatterns) {
      if (pattern.regex.test(sql)) {
        findings.push(`${file}: ${pattern.name}`);
      }
    }
  }

  return { files, findings };
}

async function runQuery<T extends QueryResultRow = QueryResultRow>(client: Client, sql: string, params?: unknown[]) {
  return client.query<T>(sql, params);
}

async function inventory(client: Client, label: string) {
  console.log(`\n=== ${label} inventory ===`);
  const project = await runQuery(client, 'select current_database() as database, current_user as db_user, now() as captured_at');
  console.log(JSON.stringify(project.rows[0], null, 2));

  const tables = await runQuery<{ table_name: string; rls_enabled: boolean; estimated_rows: string }>(client, `
    select c.relname as table_name, c.relrowsecurity as rls_enabled, c.reltuples::bigint as estimated_rows
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname
  `);
  console.log(`public tables: ${tables.rowCount}`);
  for (const row of tables.rows) {
    console.log(`- ${row.table_name}: rls=${row.rls_enabled}, estimated_rows=${row.estimated_rows}`);
  }

  const functions = await runQuery<{ function_name: string }>(client, `
    select p.proname as function_name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname ilike '%permission%' or p.proname ilike '%staff_migration%' or p.proname ilike 'user_has%' or p.proname ilike 'get_user%')
    order by p.proname
  `);
  console.log(`relevant public functions: ${functions.rows.map((row) => row.function_name).join(', ') || '(none)'}`);

  const policies = await runQuery(client, `
    select schemaname, tablename, policyname, cmd
    from pg_policies
    where schemaname in ('public', 'storage')
    order by schemaname, tablename, policyname
  `);
  console.log(`policies: ${policies.rowCount}`);

  try {
    const buckets = await runQuery<{ id: string; public: boolean }>(client, 'select id, public from storage.buckets order by id');
    console.log(`storage buckets: ${buckets.rows.map((bucket) => `${bucket.id}(public=${bucket.public})`).join(', ') || '(none)'}`);
  } catch (error) {
    console.log(`storage bucket inventory failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function validateObjects(client: Client) {
  console.log('\n=== post-migration validation ===');
  const requiredRelations = [
    'profiles',
    'groups',
    'modules',
    'user_groups',
    'group_module_permissions',
    'group_scope_rules',
    'cases',
    'events',
    'documents',
    'cost_documents',
    'notifications',
    'audit_logs',
    'staff_migration_batches',
    'staff_migration_staging',
    'staff_migration_results',
  ];

  const rels = await runQuery<{ relname: string; relkind: string; relrowsecurity: boolean }>(client, `
    select c.relname, c.relkind, c.relrowsecurity
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any($1)
    order by c.relname
  `, [requiredRelations]);
  const found = new Set(rels.rows.map((row) => row.relname));
  for (const name of requiredRelations) {
    const row = rels.rows.find((item) => item.relname === name);
    console.log(`${found.has(name) ? 'OK' : 'MISSING'} relation ${name}${row ? ` rls=${row.relrowsecurity}` : ''}`);
  }

  const views = await runQuery<{ relname: string; security_invoker: string }>(client, `
    select c.relname,
      coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name = 'security_invoker'), 'false') as security_invoker
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v' and c.relname in ('calendar_events','litigation_cost_documents')
    order by c.relname
  `);
  for (const row of views.rows) {
    console.log(`view ${row.relname} security_invoker=${row.security_invoker}`);
  }

  const requiredFunctions = [
    'get_user_permissions',
    'user_has_permission',
    'user_has_any_permission',
    'validate_staff_migration_batch',
    'apply_staff_migration_row',
  ];
  const funcs = await runQuery<{ proname: string }>(client, `
    select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and proname = any($1)
    order by proname
  `, [requiredFunctions]);
  const functionNames = new Set(funcs.rows.map((row) => row.proname));
  for (const name of requiredFunctions) {
    console.log(`${functionNames.has(name) ? 'OK' : 'MISSING'} function ${name}`);
  }

  const bucket = await runQuery<{ id: string; public: boolean }>(client, "select id, public from storage.buckets where id = 'case-documents'");
  if (bucket.rowCount) {
    console.log(`OK bucket case-documents public=${bucket.rows[0].public}`);
  } else {
    console.log('MISSING bucket case-documents');
  }
}

async function main() {
  const databaseUrl = getDatabaseUrlFromEnvironment();
  printSanitizedConnectionSummary(databaseUrl);
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const { files, findings } = scanMigrations(migrationsDir);

  if (findings.length) {
    console.error('Unsafe migration findings detected. Stopping before applying anything.');
    for (const finding of findings) console.error(`- ${finding}`);
    process.exit(3);
  }

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await inventory(client, 'pre-migration');
    console.log(`\nApplying ${files.length} migration files...`);
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`APPLY ${file}`);
      await runQuery(client, sql);
    }
    console.log('All migration files applied successfully.');
    await inventory(client, 'post-migration');
    await validateObjects(client);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Migration/validation failed. No further migrations will be applied by this run.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

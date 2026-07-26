import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const CONFIRMATION_VALUE = 'STAGING_OR_LOCAL';
const seedFilePath = join(process.cwd(), 'supabase', 'seed', 'development_seed.sql');

function requireEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function getDatabaseUrl() {
  const databaseUrl = requireEnvironment('DATABASE_URL');
  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must start with postgres:// or postgresql://');
  }
  return databaseUrl;
}

function assertStagingConfirmation() {
  const confirmation = process.env.CONFIRM_DEV_SEED?.trim();
  if (confirmation !== CONFIRMATION_VALUE) {
    throw new Error(
      `Refusing to seed database. Set CONFIRM_DEV_SEED=${CONFIRMATION_VALUE} to confirm this is a staging/local target.`,
    );
  }
}

function printConnectionSummary(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  console.log('Seed target:', {
    host: parsed.hostname,
    port: parsed.port || '(default)',
    database: parsed.pathname.replace(/^\//, ''),
    username: decodeURIComponent(parsed.username),
  });
}

async function tableCount(client: Client, table: string) {
  const result = await client.query<{ count: string }>(`select count(*)::text as count from public.${table}`);
  return Number(result.rows[0]?.count || 0);
}

async function main() {
  assertStagingConfirmation();
  const databaseUrl = getDatabaseUrl();
  printConnectionSummary(databaseUrl);

  const seedSql = readFileSync(seedFilePath, 'utf8');
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  await client.connect();
  try {
    await client.query('begin');
    await client.query(`set local app.confirm_dev_seed = '${CONFIRMATION_VALUE}'`);
    await client.query(seedSql);
    await client.query('commit');

    const [modules, groups, permissions, scopeRules, regions, divisions] = await Promise.all([
      tableCount(client, 'modules'),
      tableCount(client, 'groups'),
      tableCount(client, 'group_module_permissions'),
      tableCount(client, 'group_scope_rules'),
      tableCount(client, 'regions'),
      tableCount(client, 'divisions'),
    ]);

    console.log('Development/staging seed applied successfully.');
    console.log({ modules, groups, permissions, scopeRules, regions, divisions });
    console.log('No auth users, passwords, real cases, or real personal data were created.');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Seed failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

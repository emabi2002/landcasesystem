import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function readProjectFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function walkFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    if (entry === 'node_modules' || entry === '.next' || entry === '.git') return [];
    return statSync(fullPath).isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

describe('Phase 1 route and bundle security', () => {
  it('middleware redirects protected unauthenticated pages to login', () => {
    const source = readProjectFile('src/middleware.ts');

    expect(source).toContain("redirectUrl.pathname = '/login'");
    expect(source).toContain('redirectedFrom');
    expect(source).toContain('adminRoutePermissions');
  });

  it('does not include the service-role key in client components or browser Supabase client code', () => {
    const sourceFiles = walkFiles(join(process.cwd(), 'src'))
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
      .filter((file) => !file.endsWith('src/lib/supabase/admin.ts'))
      .filter((file) => !file.includes('/src/lib/env'))
      .filter((file) => !file.includes('/src/lib/auth/'));

    const offenders = sourceFiles.filter((file) => readFileSync(file, 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'));

    expect(offenders).toEqual([]);
  });
});

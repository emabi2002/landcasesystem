import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('login page security defaults', () => {
  it('does not prefill administrator credentials', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/login/page.tsx'), 'utf8');

    expect(source).toContain("useState('')");
    expect(source).not.toContain('<set-a-secure-password>');
    expect(source).not.toContain('<admin-email>');
  });
});

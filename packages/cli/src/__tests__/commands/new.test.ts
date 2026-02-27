import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

describe('gitlaw new', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gitlaw-new-'));
    execFileSync('git', ['init', dir]);
  });

  it('creates a document directory with canonical structure', async () => {
    const { createNewDocument } = await import('../../commands/new.js');
    await createNewDocument(dir, 'acme-nda', 'contract');
    expect(existsSync(join(dir, 'acme-nda', 'document.yaml'))).toBe(true);
    expect(existsSync(join(dir, 'acme-nda', 'sections'))).toBe(true);
    expect(existsSync(join(dir, 'acme-nda', '.gitlaw'))).toBe(true);
  });
});

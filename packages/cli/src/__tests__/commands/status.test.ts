import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createNewDocument } from '../../commands/new.js';

describe('gitlaw status', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gitlaw-status-'));
    execFileSync('git', ['init', dir]);
  });

  it('finds and reports document statuses', async () => {
    await createNewDocument(dir, 'nda', 'contract');
    await createNewDocument(dir, 'policy', 'policy');

    const { getRepoStatus } = await import('../../commands/status.js');
    const statuses = await getRepoStatus(dir);
    expect(statuses).toHaveLength(2);
    expect(statuses[0].status).toBe('draft');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { ClauseLibrary } from '../../documents/clause-library.js';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('ClauseLibrary', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gitlaw-clauses-'));
  });

  it('adds and retrieves a clause', async () => {
    const lib = new ClauseLibrary(join(dir, '.gitlaw', 'clauses'));
    await lib.add('confidentiality', 'All information shall remain confidential.');
    const clause = await lib.get('confidentiality');
    expect(clause).toContain('confidential');
  });

  it('lists all clauses', async () => {
    const lib = new ClauseLibrary(join(dir, '.gitlaw', 'clauses'));
    await lib.add('clause-a', 'Content A');
    await lib.add('clause-b', 'Content B');
    const list = await lib.list();
    expect(list).toContain('clause-a');
    expect(list).toContain('clause-b');
  });
});

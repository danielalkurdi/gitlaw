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

  it('rejects clause IDs with path traversal characters', async () => {
    const lib = new ClauseLibrary(join(dir, '.gitlaw', 'clauses'));
    await expect(lib.add('../etc/passwd', 'malicious')).rejects.toThrow('Invalid clause ID');
    await expect(lib.get('../../secret')).rejects.toThrow('Invalid clause ID');
    await expect(lib.add('hello world', 'spaces')).rejects.toThrow('Invalid clause ID');
    await expect(lib.add('a/b', 'slash')).rejects.toThrow('Invalid clause ID');
  });

  it('accepts valid clause IDs', async () => {
    const lib = new ClauseLibrary(join(dir, '.gitlaw', 'clauses'));
    await lib.add('valid-clause_ID_123', 'content');
    const content = await lib.get('valid-clause_ID_123');
    expect(content).toBe('content');
  });
});

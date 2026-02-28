import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

describe('gitlaw init', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gitlaw-init-'));
    execFileSync('git', ['init', dir]);
  });

  it('creates .gitlaw/ config directory', async () => {
    const { initGitlawRepo } = await import('../../commands/init.js');
    await initGitlawRepo(dir);
    expect(existsSync(join(dir, '.gitlaw', 'config.yaml'))).toBe(true);
  });

  it('creates default workflow config', async () => {
    const { initGitlawRepo } = await import('../../commands/init.js');
    await initGitlawRepo(dir);
    const config = await readFile(join(dir, '.gitlaw', 'config.yaml'), 'utf-8');
    expect(config).toContain('min_approvals');
  });
});

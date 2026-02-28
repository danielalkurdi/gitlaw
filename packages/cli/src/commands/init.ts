import { Command, Flags } from '@oclif/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const DEFAULT_CONFIG = `workflows:
  default:
    review:
      min_approvals: 1
      required_reviewers: []
      allow_self_approval: false
    finalisation:
      requires_all_reviewers: true
      requires_signature: true
`;

export async function initGitlawRepo(dir: string): Promise<void> {
  const gitlawDir = join(dir, '.gitlaw');
  await mkdir(gitlawDir, { recursive: true });
  await writeFile(join(gitlawDir, 'config.yaml'), DEFAULT_CONFIG);
}

export default class Init extends Command {
  static override description = 'Initialize a gitlaw repository';

  static override flags = {
    template: Flags.string({ description: 'Template type', required: false }),
  };

  async run(): Promise<void> {
    const gitDir = join(process.cwd(), '.git');
    if (!existsSync(gitDir)) {
      this.error('Not a git repository. Run "git init" first.');
    }

    await initGitlawRepo(process.cwd());
    this.log('Initialized gitlaw repository.');
  }
}

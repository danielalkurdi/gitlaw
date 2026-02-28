import { Command } from '@oclif/core';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readDocument } from '@gitlaw/core';

interface DocStatus {
  name: string;
  title: string;
  type: string;
  status: string;
}

export async function getRepoStatus(dir: string): Promise<DocStatus[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const statuses: DocStatus[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const docYaml = join(dir, entry.name, 'document.yaml');
    if (!existsSync(docYaml)) continue;

    const doc = await readDocument(join(dir, entry.name));
    statuses.push({
      name: entry.name,
      title: doc.meta.title,
      type: doc.meta.type,
      status: doc.meta.status,
    });
  }

  return statuses;
}

export default class Status extends Command {
  static override description = 'Show document statuses';

  async run(): Promise<void> {
    const statuses = await getRepoStatus(process.cwd());
    if (statuses.length === 0) {
      this.log('No gitlaw documents found.');
      return;
    }
    for (const doc of statuses) {
      this.log(`  ${doc.name}  [${doc.status}]  ${doc.title} (${doc.type})`);
    }
  }
}

import { Command, Args } from '@oclif/core';
import { AuditLog } from '@gitlaw/core';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function getAuditLogPath(baseDir: string): string {
  return join(baseDir, '.gitlaw', 'audit.json');
}

export async function loadAuditLog(baseDir: string): Promise<AuditLog> {
  const path = getAuditLogPath(baseDir);
  if (!existsSync(path)) return new AuditLog();
  const json = await readFile(path, 'utf-8');
  return AuditLog.deserialize(json);
}

export default class AuditLogCmd extends Command {
  static override description = 'View audit log for a document';

  static override args = {
    document: Args.string({ description: 'Document directory', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(AuditLogCmd);
    const log = await loadAuditLog(process.cwd());
    const entries = log.forDocument(args.document);

    if (entries.length === 0) {
      this.log('No audit entries found.');
      return;
    }

    for (const entry of entries) {
      this.log(`[${entry.timestamp}] ${entry.event} by ${entry.actor} (${entry.id.substring(0, 8)})`);
    }
  }
}

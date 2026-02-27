import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import yaml from 'js-yaml';
import type { DocumentMeta, GitlawTracking } from './types.js';

export async function writeDocument(
  docDir: string,
  meta: DocumentMeta,
  sectionContents: Map<string, string>,
): Promise<void> {
  await mkdir(docDir, { recursive: true });

  await writeFile(join(docDir, 'document.yaml'), yaml.dump(meta));

  for (const [relPath, content] of sectionContents) {
    const fullPath = join(docDir, relPath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  }

  const tracking: GitlawTracking = {
    signatures: [],
    audit_log_ref: 'refs/notes/gitlaw-audit',
    workflow_state: {
      current_reviewers: [],
      approvals: [],
    },
  };
  await writeFile(join(docDir, '.gitlaw'), yaml.dump(tracking));
}

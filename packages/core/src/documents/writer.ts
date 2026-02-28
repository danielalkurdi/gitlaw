import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import yaml from 'js-yaml';
import type { DocumentMeta, GitlawTracking } from './types.js';

export async function writeDocument(
  docDir: string,
  meta: DocumentMeta,
  sectionContents: Map<string, string>,
): Promise<void> {
  await mkdir(docDir, { recursive: true });

  await writeFile(join(docDir, 'document.yaml'), yaml.dump(meta));

  const resolvedDocDir = resolve(docDir);
  for (const [relPath, content] of sectionContents) {
    const fullPath = resolve(join(docDir, relPath));
    if (!fullPath.startsWith(resolvedDocDir + '/') && fullPath !== resolvedDocDir) {
      throw new Error(`Path traversal detected: ${relPath} resolves outside document directory`);
    }
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

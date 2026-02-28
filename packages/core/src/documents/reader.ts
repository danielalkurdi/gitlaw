import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';
import type { DocumentMeta, GitlawTracking } from './types.js';
import { parseClauses, type ParsedSection } from './clause-parser.js';

export interface LoadedSection {
  id: string;
  file: string;
  raw: string;
  parsed: ParsedSection;
}

export interface LoadedDocument {
  path: string;
  meta: DocumentMeta;
  sections: LoadedSection[];
  tracking: GitlawTracking;
}

export async function readDocument(docDir: string): Promise<LoadedDocument> {
  const metaRaw = await readFile(join(docDir, 'document.yaml'), 'utf-8');
  const meta = yaml.load(metaRaw) as DocumentMeta;

  const trackingRaw = await readFile(join(docDir, '.gitlaw'), 'utf-8');
  const tracking = yaml.load(trackingRaw) as GitlawTracking;

  const sections: LoadedSection[] = [];
  const resolvedDocDir = resolve(docDir);
  for (const ref of meta.sections) {
    const sectionPath = resolve(join(docDir, ref.file));
    if (!sectionPath.startsWith(resolvedDocDir + '/') && sectionPath !== resolvedDocDir) {
      throw new Error(`Path traversal detected: ${ref.file} resolves outside document directory`);
    }
    const raw = await readFile(sectionPath, 'utf-8');
    const parsed = parseClauses(raw);
    sections.push({ id: ref.id, file: ref.file, raw, parsed });
  }

  return { path: docDir, meta, sections, tracking };
}

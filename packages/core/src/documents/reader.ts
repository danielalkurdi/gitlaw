import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
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
  for (const ref of meta.sections) {
    const raw = await readFile(join(docDir, ref.file), 'utf-8');
    const parsed = parseClauses(raw);
    sections.push({ id: ref.id, file: ref.file, raw, parsed });
  }

  return { path: docDir, meta, sections, tracking };
}

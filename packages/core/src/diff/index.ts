import type { LoadedDocument } from '../documents/reader.js';
import type { DocumentDiff } from './types.js';
import { diffSections } from './document-diff.js';
import { parseClauses } from '../documents/clause-parser.js';

export type { DocumentDiff, SectionDiff, Change } from './types.js';

export function diffDocuments(oldDoc: LoadedDocument, newDoc: LoadedDocument): DocumentDiff {
  const oldSectionMap = new Map(oldDoc.sections.map(s => [s.id, s]));
  const newSectionMap = new Map(newDoc.sections.map(s => [s.id, s]));
  const sections: DocumentDiff['sections'] = [];
  let added = 0, removed = 0, modified = 0, moved = 0;

  for (const [id, newSection] of newSectionMap) {
    const oldSection = oldSectionMap.get(id);
    if (oldSection) {
      const diff = diffSections(oldSection.parsed, newSection.parsed);
      diff.sectionId = id;
      for (const c of diff.changes) {
        if (c.type === 'added') added++;
        else if (c.type === 'removed') removed++;
        else if (c.type === 'modified') modified++;
        else if (c.type === 'moved') moved++;
      }
      sections.push(diff);
    } else {
      const diff = diffSections(parseClauses(''), newSection.parsed);
      diff.sectionId = id;
      added += diff.changes.length;
      sections.push(diff);
    }
  }

  for (const [id, oldSection] of oldSectionMap) {
    if (!newSectionMap.has(id)) {
      const diff = diffSections(oldSection.parsed, parseClauses(''));
      diff.sectionId = id;
      removed += diff.changes.length;
      sections.push(diff);
    }
  }

  return { sections, summary: { added, removed, modified, moved } };
}

import type { WordChange } from './word-diff.js';

export interface Change {
  type: 'added' | 'removed' | 'modified' | 'moved';
  clauseId?: string;
  location: { paragraph: number; offset?: number };
  old?: string;
  new?: string;
  wordDiff?: WordChange[];
}

export interface SectionDiff {
  sectionId?: string;
  changes: Change[];
}

export interface DocumentDiff {
  sections: SectionDiff[];
  summary: { added: number; removed: number; modified: number; moved: number };
}

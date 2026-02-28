import { describe, it, expect } from 'vitest';
import { diffDocuments } from '../../diff/index.js';
import type { LoadedDocument } from '../../documents/reader.js';
import { parseClauses } from '../../documents/clause-parser.js';

function makeDoc(sections: { id: string; raw: string }[]): LoadedDocument {
  return {
    path: '/test',
    meta: { title: 'Test', type: 'contract', parties: [], created: '2026-01-01', status: 'draft', sections: sections.map(s => ({ id: s.id, file: `sections/${s.id}.md` })) },
    sections: sections.map(s => ({ id: s.id, file: `sections/${s.id}.md`, raw: s.raw, parsed: parseClauses(s.raw) })),
    tracking: { signatures: [], audit_log_ref: '', workflow_state: { current_reviewers: [], approvals: [] } },
  };
}

describe('diffDocuments', () => {
  it('returns empty diff for identical documents', () => {
    const doc = makeDoc([{ id: 'a', raw: 'Same text.' }]);
    const result = diffDocuments(doc, doc);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.modified).toBe(0);
  });

  it('diffs matching sections by ID', () => {
    const old = makeDoc([{ id: 'intro', raw: '{{clause:x}}\nOld.\n{{/clause}}' }]);
    const new_ = makeDoc([{ id: 'intro', raw: '{{clause:x}}\nNew.\n{{/clause}}' }]);
    const result = diffDocuments(old, new_);
    expect(result.summary.modified).toBe(1);
    expect(result.sections[0].sectionId).toBe('intro');
  });

  it('detects added sections', () => {
    const old = makeDoc([]);
    const new_ = makeDoc([{ id: 'new-section', raw: 'Content.' }]);
    const result = diffDocuments(old, new_);
    expect(result.summary.added).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  writeDocument,
  readDocument,
  diffDocuments,
  validateDocumentMeta,
  canTransition,
  ReviewManager,
  AuditLog,
} from '../../index.js';
import type { DocumentMeta } from '../../index.js';

describe('full workflow integration', () => {
  it('creates, reads, diffs, reviews, and audits a document', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gitlaw-e2e-'));
    const docDir = join(dir, 'test-nda');

    // 1. Create document
    const meta: DocumentMeta = {
      title: 'Test NDA',
      type: 'contract',
      parties: [{ name: 'Acme', role: 'disclosing' }],
      created: '2026-02-27',
      status: 'draft',
      sections: [{ id: 'defs', file: 'sections/01-defs.md' }],
    };
    expect(validateDocumentMeta(meta).valid).toBe(true);

    await writeDocument(docDir, meta, new Map([
      ['sections/01-defs.md', '{{clause:conf}}\nOld definition.\n{{/clause}}\n'],
    ]));

    // 2. Read it back
    const doc = await readDocument(docDir);
    expect(doc.meta.title).toBe('Test NDA');
    expect(doc.sections[0].parsed.clauses[0].id).toBe('conf');

    // 3. Create a modified version
    const docDir2 = join(dir, 'test-nda-v2');
    const meta2 = { ...meta, status: 'review' as const };
    await writeDocument(docDir2, meta2, new Map([
      ['sections/01-defs.md', '{{clause:conf}}\nUpdated definition.\n{{/clause}}\n'],
    ]));
    const doc2 = await readDocument(docDir2);

    // 4. Diff
    const diff = diffDocuments(doc, doc2);
    expect(diff.summary.modified).toBe(1);

    // 5. Workflow
    expect(canTransition('draft', 'review')).toBe(true);
    const mgr = new ReviewManager();
    mgr.requestReview({ document: 'test-nda', reviewers: ['alice'], requester: 'bob', commit: 'abc' });
    mgr.submitReview({ document: 'test-nda', reviewer: 'alice', decision: 'approved', commit: 'abc' });
    expect(mgr.isFullyApproved('test-nda')).toBe(true);

    // 6. Audit
    const log = new AuditLog();
    log.append({ actor: 'bob', event: 'document_created', document: 'test-nda', commit: 'abc', details: {} });
    log.append({ actor: 'alice', event: 'review_decision', document: 'test-nda', commit: 'abc', details: { decision: 'approved' } });
    expect(log.verify()).toBe(true);
    expect(log.forDocument('test-nda')).toHaveLength(2);
  });
});

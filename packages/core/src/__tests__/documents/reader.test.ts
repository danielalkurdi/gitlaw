import { describe, it, expect, beforeEach } from 'vitest';
import { readDocument } from '../../documents/reader.js';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('readDocument', () => {
  let docDir: string;

  beforeEach(async () => {
    docDir = await mkdtemp(join(tmpdir(), 'gitlaw-test-'));
    await mkdir(join(docDir, 'sections'), { recursive: true });

    await writeFile(join(docDir, 'document.yaml'), `
title: "Test NDA"
type: contract
parties:
  - name: "Acme"
    role: disclosing
created: "2026-02-27"
status: draft
sections:
  - id: definitions
    file: sections/01-definitions.md
`);

    await writeFile(join(docDir, 'sections', '01-definitions.md'), `## Definitions\n\n{{clause:confidential-info}}\nConfidential info means secret stuff.\n{{/clause}}\n`);

    await writeFile(join(docDir, '.gitlaw'), `
signatures: []
audit_log_ref: "refs/notes/gitlaw-audit"
workflow_state:
  current_reviewers: []
  approvals: []
`);
  });

  it('reads document metadata', async () => {
    const doc = await readDocument(docDir);
    expect(doc.meta.title).toBe('Test NDA');
    expect(doc.meta.status).toBe('draft');
  });

  it('reads and parses sections', async () => {
    const doc = await readDocument(docDir);
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].id).toBe('definitions');
    expect(doc.sections[0].parsed.clauses).toHaveLength(1);
  });

  it('reads gitlaw tracking file', async () => {
    const doc = await readDocument(docDir);
    expect(doc.tracking.audit_log_ref).toBe('refs/notes/gitlaw-audit');
  });
});

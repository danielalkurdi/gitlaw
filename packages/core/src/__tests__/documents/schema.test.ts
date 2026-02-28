import { describe, it, expect } from 'vitest';
import { validateDocumentMeta, DocumentMeta } from '../../documents/schema.js';

describe('validateDocumentMeta', () => {
  it('accepts a valid document metadata object', () => {
    const meta: DocumentMeta = {
      title: 'Non-Disclosure Agreement',
      type: 'contract',
      parties: [
        { name: 'Acme Corp', role: 'disclosing' },
        { name: 'Widget Inc', role: 'receiving' },
      ],
      created: '2026-02-27',
      status: 'draft',
      sections: [
        { id: 'definitions', file: 'sections/01-definitions.md' },
      ],
    };
    const result = validateDocumentMeta(meta);
    expect(result.valid).toBe(true);
  });

  it('rejects missing title', () => {
    const meta = { type: 'contract', parties: [], created: '2026-02-27', status: 'draft', sections: [] };
    const result = validateDocumentMeta(meta as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title is required');
  });

  it('rejects invalid status', () => {
    const meta = {
      title: 'Test', type: 'contract', parties: [], created: '2026-02-27', status: 'invalid', sections: [],
    };
    const result = validateDocumentMeta(meta as any);
    expect(result.valid).toBe(false);
  });
});

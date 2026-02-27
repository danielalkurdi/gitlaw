import { describe, it, expect } from 'vitest';
import { writeDocument } from '../../documents/writer.js';
import { readDocument } from '../../documents/reader.js';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DocumentMeta } from '../../documents/types.js';

describe('writeDocument', () => {
  it('writes and round-trips a document', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gitlaw-write-'));
    const docDir = join(dir, 'test-doc');

    const meta: DocumentMeta = {
      title: 'Test Agreement',
      type: 'contract',
      parties: [{ name: 'Alice', role: 'party-a' }],
      created: '2026-02-27',
      status: 'draft',
      sections: [{ id: 'intro', file: 'sections/01-intro.md' }],
    };

    const sectionContents = new Map([
      ['sections/01-intro.md', '## Introduction\n\nThis is the intro.\n'],
    ]);

    await writeDocument(docDir, meta, sectionContents);

    const loaded = await readDocument(docDir);
    expect(loaded.meta.title).toBe('Test Agreement');
    expect(loaded.sections[0].raw).toContain('This is the intro.');
    expect(loaded.tracking.signatures).toEqual([]);
  });
});

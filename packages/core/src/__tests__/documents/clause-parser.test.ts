import { describe, it, expect } from 'vitest';
import { parseClauses, type ParsedSection } from '../../documents/clause-parser.js';

describe('parseClauses', () => {
  it('extracts a single clause', () => {
    const md = `## Definitions\n\n{{clause:confidential-info}}\n"Confidential Information" means any information disclosed.\n{{/clause}}\n`;
    const result = parseClauses(md);
    expect(result.clauses).toHaveLength(1);
    expect(result.clauses[0].id).toBe('confidential-info');
    expect(result.clauses[0].content.trim()).toBe('"Confidential Information" means any information disclosed.');
  });

  it('extracts multiple clauses', () => {
    const md = `{{clause:a}}\nFirst clause.\n{{/clause}}\n\nSome unmarked text.\n\n{{clause:b}}\nSecond clause.\n{{/clause}}`;
    const result = parseClauses(md);
    expect(result.clauses).toHaveLength(2);
    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0].content.trim()).toBe('Some unmarked text.');
  });

  it('handles text with no clauses', () => {
    const md = `Just a plain paragraph.\n\nAnother paragraph.`;
    const result = parseClauses(md);
    expect(result.clauses).toHaveLength(0);
    expect(result.paragraphs).toHaveLength(2);
  });
});

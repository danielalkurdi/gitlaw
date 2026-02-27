import { describe, it, expect } from 'vitest';
import { VERSION, validateDocumentMeta, parseClauses, diffDocuments, canTransition, ReviewManager, AuditLog } from '../index.js';

describe('core public API', () => {
  it('exports version', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('exports document utilities', () => {
    expect(typeof validateDocumentMeta).toBe('function');
    expect(typeof parseClauses).toBe('function');
  });

  it('exports diff utilities', () => {
    expect(typeof diffDocuments).toBe('function');
  });

  it('exports workflow utilities', () => {
    expect(typeof canTransition).toBe('function');
    expect(ReviewManager).toBeDefined();
  });

  it('exports audit utilities', () => {
    expect(AuditLog).toBeDefined();
  });
});

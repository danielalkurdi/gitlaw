import { describe, it, expect } from 'vitest';
import { AuditLog } from '../../audit/audit-log.js';

describe('AuditLog', () => {
  it('appends an entry with hash', () => {
    const log = new AuditLog();
    const entry = log.append({ actor: 'alice', event: 'document_created', document: 'contracts/nda', commit: 'abc123', details: { title: 'NDA' } });
    expect(entry.id).toBeTruthy();
    expect(entry.prev).toBeNull();
  });

  it('chains entries via prev hash', () => {
    const log = new AuditLog();
    const first = log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    const second = log.append({ actor: 'bob', event: 'review_requested', document: 'nda', commit: 'def', details: {} });
    expect(second.prev).toBe(first.id);
  });

  it('verifies an intact chain', () => {
    const log = new AuditLog();
    log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    log.append({ actor: 'bob', event: 'review_requested', document: 'nda', commit: 'def', details: {} });
    expect(log.verify()).toBe(true);
  });

  it('detects a tampered chain', () => {
    const log = new AuditLog();
    log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    log.append({ actor: 'bob', event: 'review_requested', document: 'nda', commit: 'def', details: {} });
    log.entries[0].actor = 'eve';
    expect(log.verify()).toBe(false);
  });

  it('filters entries by document', () => {
    const log = new AuditLog();
    log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    log.append({ actor: 'alice', event: 'document_created', document: 'contract', commit: 'def', details: {} });
    expect(log.forDocument('nda')).toHaveLength(1);
  });

  it('serializes and deserializes', () => {
    const log = new AuditLog();
    log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    const json = log.serialize();
    const restored = AuditLog.deserialize(json);
    expect(restored.verify()).toBe(true);
    expect(restored.entries).toHaveLength(1);
  });
});

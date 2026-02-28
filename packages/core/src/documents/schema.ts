import type { DocumentMeta, DocumentStatus } from './types.js';
export type { DocumentMeta } from './types.js';

const VALID_STATUSES: DocumentStatus[] = ['draft', 'review', 'approved', 'finalised', 'archived'];
const VALID_TYPES = ['contract', 'policy', 'brief'];

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDocumentMeta(meta: unknown): ValidationResult {
  const errors: string[] = [];
  const obj = meta as Record<string, unknown>;

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['input must be an object'] };
  }
  if (typeof obj.title !== 'string' || !obj.title) {
    errors.push('title is required');
  }
  if (!VALID_TYPES.includes(obj.type as string)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (!Array.isArray(obj.parties)) {
    errors.push('parties must be an array');
  }
  if (typeof obj.created !== 'string' || !obj.created) {
    errors.push('created is required');
  }
  if (!VALID_STATUSES.includes(obj.status as DocumentStatus)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (!Array.isArray(obj.sections)) {
    errors.push('sections must be an array');
  }

  return { valid: errors.length === 0, errors };
}

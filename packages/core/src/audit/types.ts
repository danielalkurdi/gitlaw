export type AuditEventType = 'document_created' | 'section_modified' | 'review_requested' | 'review_decision' | 'status_transition' | 'signature_added' | 'document_exported' | 'document_accessed';

export interface AuditEntry {
  id: string;
  prev: string | null;
  timestamp: string;
  actor: string;
  event: AuditEventType;
  document: string;
  commit: string;
  details: Record<string, unknown>;
}

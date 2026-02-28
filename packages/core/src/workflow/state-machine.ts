export type DocumentStatus = 'draft' | 'review' | 'approved' | 'finalised' | 'archived';

const TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ['review'],
  review: ['approved', 'draft'],
  approved: ['finalised', 'review'],
  finalised: ['archived'],
  archived: [],
};

export function canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transition(from: DocumentStatus, to: DocumentStatus): DocumentStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition: ${from} -> ${to}`);
  }
  return to;
}

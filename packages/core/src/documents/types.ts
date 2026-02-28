export type DocumentStatus = 'draft' | 'review' | 'approved' | 'finalised' | 'archived';
export type DocumentType = 'contract' | 'policy' | 'brief';

export interface Party {
  name: string;
  role: string;
}

export interface SectionRef {
  id: string;
  file: string;
}

export interface DocumentMeta {
  title: string;
  type: DocumentType;
  parties: Party[];
  created: string;
  status: DocumentStatus;
  sections: SectionRef[];
}

export interface GitlawTracking {
  signatures: Signature[];
  audit_log_ref: string;
  workflow_state: WorkflowState;
}

export interface Signature {
  signer: string;
  key_id: string;
  timestamp: string;
  commit: string;
  scope: string;
  method: 'ssh' | 'gpg';
}

export interface WorkflowState {
  current_reviewers: string[];
  approvals: string[];
}

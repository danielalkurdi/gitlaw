export interface ReviewRequest {
  document: string;
  reviewers: string[];
  requester: string;
  commit: string;
  timestamp: string;
  status: 'pending' | 'completed';
}

export interface ReviewRecord {
  document: string;
  reviewer: string;
  decision: 'approved' | 'rejected';
  comment?: string;
  commit: string;
  timestamp: string;
}

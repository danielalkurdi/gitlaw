import type { ReviewRequest, ReviewRecord } from './types.js';
export type { ReviewRecord } from './types.js';

interface RequestReviewInput { document: string; reviewers: string[]; requester: string; commit: string; }
interface SubmitReviewInput { document: string; reviewer: string; decision: 'approved' | 'rejected'; comment?: string; commit: string; }

export class ReviewManager {
  private requests: Map<string, ReviewRequest> = new Map();
  private reviews: Map<string, ReviewRecord[]> = new Map();

  requestReview(input: RequestReviewInput): ReviewRequest {
    const request: ReviewRequest = { ...input, timestamp: new Date().toISOString(), status: 'pending' };
    this.requests.set(input.document, request);
    if (!this.reviews.has(input.document)) { this.reviews.set(input.document, []); }
    return request;
  }

  submitReview(input: SubmitReviewInput): ReviewRecord {
    const record: ReviewRecord = { ...input, timestamp: new Date().toISOString() };
    const reviews = this.reviews.get(input.document) ?? [];
    reviews.push(record);
    this.reviews.set(input.document, reviews);
    return record;
  }

  isFullyApproved(document: string): boolean {
    const request = this.requests.get(document);
    if (!request) return false;
    const reviews = this.reviews.get(document) ?? [];
    const approved = new Set(reviews.filter(r => r.decision === 'approved').map(r => r.reviewer));
    return request.reviewers.every(r => approved.has(r));
  }

  getReviews(document: string): ReviewRecord[] { return this.reviews.get(document) ?? []; }
}

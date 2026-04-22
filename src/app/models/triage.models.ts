export type RequestStatus = 'New' | 'In Review' | 'In Progress' | 'Resolved' | 'Closed';
export type RequestPriority = 'Low' | 'Medium' | 'High';

export const STATUSES: RequestStatus[] = ['New', 'In Review', 'In Progress', 'Resolved', 'Closed'];
export const PRIORITIES: RequestPriority[] = ['Low', 'Medium', 'High'];

/**
 * Allowed status transitions mirror the backend rules in the user story:
 * New → In Review → In Progress → Resolved → Closed.
 * A request in In Review or In Progress can also be sent back one step.
 */
export const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  New: ['In Review'],
  'In Review': ['In Progress', 'New'],
  'In Progress': ['Resolved', 'In Review'],
  Resolved: ['Closed', 'In Progress'],
  Closed: []
};

export interface StatusHistoryEntry {
  at: string; // ISO timestamp
  by: string;
  from: RequestStatus | null;
  to: RequestStatus;
}

export interface Classification {
  category: string;
  priority: RequestPriority;
  summary: string;
  tags: string[];
}

export interface TriageRequest {
  id: string;
  title: string;
  description: string;
  requesterName: string;
  businessUnit: string;
  context?: string;
  status: RequestStatus;
  createdAt: string;
  classification?: Classification;
  classifying: boolean;
  history: StatusHistoryEntry[];
}

export interface SimilarResult {
  request: TriageRequest;
  score: number;
  reasoning: string;
}

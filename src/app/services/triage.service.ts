import { Injectable, computed, signal } from '@angular/core';
import {
  Classification,
  RequestStatus,
  STATUS_TRANSITIONS,
  SimilarResult,
  StatusHistoryEntry,
  TriageRequest
} from '../models/triage.models';
import { Classifier, RuleBasedClassifier } from './classifier';
import { SEED_REQUESTS, SeedRequest } from './seed-data';
import { TfIdfSimilarity } from './similarity';

/**
 * In-memory store for triage requests. Simulates the backend behaviour
 * described in the user story: async classification via a queue, pluggable
 * classifier, TF‑IDF similarity, status-transition rules with audit history,
 * and a CSV export.
 *
 * The queue is a simple Promise-chain — it plays the same role as the
 * System.Threading.Channels + BackgroundService pairing on the .NET side:
 * the submit call returns immediately, and classification is processed
 * asynchronously by a single worker.
 */
@Injectable({ providedIn: 'root' })
export class TriageService {
  private readonly classifier: Classifier = new RuleBasedClassifier();
  private readonly similarity = new TfIdfSimilarity();

  private readonly _requests = signal<TriageRequest[]>([]);
  readonly requests = this._requests.asReadonly();
  readonly categories = computed(() => {
    const set = new Set<string>();
    for (const r of this._requests()) {
      if (r.classification) set.add(r.classification.category);
    }
    return Array.from(set).sort();
  });

  private workerTail: Promise<void> = Promise.resolve();

  constructor() {
    this.seed();
  }

  /** Submit a new request. Returns the new id immediately (202-style). */
  submit(input: SeedRequest): string {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const req: TriageRequest = {
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      requesterName: input.requesterName.trim(),
      businessUnit: input.businessUnit.trim(),
      context: input.context?.trim() || undefined,
      status: 'New',
      createdAt: now,
      classifying: true,
      history: [{ at: now, by: input.requesterName.trim() || 'system', from: null, to: 'New' }]
    };
    this._requests.update(list => [req, ...list]);
    this.enqueueClassification(id);
    return id;
  }

  getById(id: string): TriageRequest | undefined {
    return this._requests().find(r => r.id === id);
  }

  findSimilar(id: string, topN = 3): SimilarResult[] {
    const target = this.getById(id);
    if (!target) return [];
    return this.similarity.findSimilar(target, this._requests(), topN);
  }

  /** Returns the legal next statuses for the given request. */
  allowedTransitions(status: RequestStatus): RequestStatus[] {
    return STATUS_TRANSITIONS[status] ?? [];
  }

  changeStatus(id: string, next: RequestStatus, actor: string): boolean {
    const current = this.getById(id);
    if (!current) return false;
    if (!this.allowedTransitions(current.status).includes(next)) {
      return false;
    }
    const entry: StatusHistoryEntry = {
      at: new Date().toISOString(),
      by: actor || 'unknown',
      from: current.status,
      to: next
    };
    this._requests.update(list =>
      list.map(r =>
        r.id === id ? { ...r, status: next, history: [...r.history, entry] } : r
      )
    );
    return true;
  }

  /** Produces a CSV "gold layer" export — see README. */
  exportCsv(): string {
    const rows = this._requests();
    const header = [
      'id', 'title', 'description', 'requesterName', 'businessUnit',
      'status', 'category', 'priority', 'summary', 'tags', 'createdAt'
    ];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        r.id,
        r.title,
        r.description,
        r.requesterName,
        r.businessUnit,
        r.status,
        r.classification?.category ?? '',
        r.classification?.priority ?? '',
        r.classification?.summary ?? '',
        (r.classification?.tags ?? []).join('|'),
        r.createdAt
      ].map(csvEscape).join(','));
    }
    return lines.join('\n');
  }

  private enqueueClassification(id: string): void {
    this.workerTail = this.workerTail.then(async () => {
      // Simulate async processing delay.
      await new Promise(res => setTimeout(res, 600));
      const req = this.getById(id);
      if (!req) return;
      let classification: Classification;
      try {
        classification = await this.classifier.classify({
          title: req.title,
          description: req.description,
          context: req.context
        });
      } catch {
        classification = {
          category: 'General',
          priority: 'Low',
          summary: req.title,
          tags: ['general']
        };
      }
      this._requests.update(list =>
        list.map(r =>
          r.id === id ? { ...r, classification, classifying: false } : r
        )
      );
    });
  }

  private seed(): void {
    for (const s of SEED_REQUESTS) {
      this.submit(s);
    }
  }
}

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

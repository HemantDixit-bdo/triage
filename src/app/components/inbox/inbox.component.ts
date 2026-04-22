import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PRIORITIES, RequestPriority, RequestStatus, STATUSES } from '../../models/triage.models';
import { TriageService } from '../../services/triage.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, LowerCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inbox.component.html',
  styleUrl: './inbox.component.css'
})
export class InboxComponent {
  private readonly triage = inject(TriageService);

  readonly statuses = STATUSES;
  readonly priorities = PRIORITIES;
  readonly categories = this.triage.categories;
  readonly triageCount = computed(() => this.triage.requests().length);

  readonly statusFilter = signal<RequestStatus | ''>('');
  readonly priorityFilter = signal<RequestPriority | ''>('');
  readonly categoryFilter = signal<string>('');
  readonly searchText = signal<string>('');

  readonly filtered = computed(() => {
    const s = this.statusFilter();
    const p = this.priorityFilter();
    const c = this.categoryFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.triage.requests().filter(r => {
      if (s && r.status !== s) return false;
      if (p && r.classification?.priority !== p) return false;
      if (c && r.classification?.category !== c) return false;
      if (q) {
        const haystack = `${r.title} ${r.description} ${r.requesterName} ${r.businessUnit} ${r.classification?.tags?.join(' ') ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  });

  clearFilters(): void {
    this.statusFilter.set('');
    this.priorityFilter.set('');
    this.categoryFilter.set('');
    this.searchText.set('');
  }

  exportCsv(): void {
    const csv = this.triage.exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Convert a status like "In Review" to a CSS-safe "in-review" suffix. */
  statusClass(status: RequestStatus): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}

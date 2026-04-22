import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe, LowerCasePipe, PercentPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestStatus } from '../../models/triage.models';
import { TriageService } from '../../services/triage.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, LowerCasePipe, PercentPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.css'
})
export class RequestDetailComponent {
  private readonly triage = inject(TriageService);
  private readonly router = inject(Router);

  /** Route param `id` bound via `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  readonly request = computed(() => this.triage.requests().find(r => r.id === this.id()));
  readonly similar = computed(() => {
    const r = this.request();
    return r ? this.triage.findSimilar(r.id) : [];
  });
  readonly allowedNext = computed(() => {
    const r = this.request();
    return r ? this.triage.allowedTransitions(r.status) : [];
  });

  readonly actor = signal<string>('triage lead');

  changeStatus(to: RequestStatus): void {
    const r = this.request();
    if (!r) return;
    this.triage.changeStatus(r.id, to, this.actor());
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  statusClass(status: RequestStatus): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { TriageService } from '../../services/triage.service';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-form.component.html',
  styleUrl: './request-form.component.css'
})
export class RequestFormComponent {
  private readonly triage = inject(TriageService);
  private readonly router = inject(Router);

  readonly model = signal({
    title: '',
    description: '',
    requesterName: '',
    businessUnit: '',
    context: ''
  });

  submit(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    const id = this.triage.submit(this.model());
    this.router.navigate(['/requests', id]);
  }

  update<K extends keyof ReturnType<(typeof this)['model']>>(field: K, value: string): void {
    this.model.update(m => ({ ...m, [field]: value }));
  }
}

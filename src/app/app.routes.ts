import { Routes } from '@angular/router';
import { InboxComponent } from './components/inbox/inbox.component';
import { RequestDetailComponent } from './components/request-detail/request-detail.component';
import { RequestFormComponent } from './components/request-form/request-form.component';

export const routes: Routes = [
  { path: '', component: InboxComponent, title: 'Inbox · Triage' },
  { path: 'new', component: RequestFormComponent, title: 'New request · Triage' },
  { path: 'requests/:id', component: RequestDetailComponent, title: 'Request · Triage' },
  { path: '**', redirectTo: '' }
];

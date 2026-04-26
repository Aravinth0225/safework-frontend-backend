import { Component, computed, signal, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Audit } from '../../core/models';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, SlicePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Audits</div>
          <div class="page-subtitle">Plan and track compliance audits</div>
        </div>
        <button class="btn btn-primary" *ngIf="canAdd()" (click)="openForm()">+ New Audit</button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search audits..." />
            </div>
            <select class="form-control" style="width:160px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Planned</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} audits</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Scope</th><th>Auditor</th><th>Findings</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of filtered()">
                <td class="fw-500" style="max-width:200px">{{ a.scope | slice:0:50 }}{{ a.scope.length > 50 ? '...' : '' }}</td>
                <td class="text-sm">{{ a.officerName }}</td>
                <td style="max-width:240px" class="text-sm text-muted">{{ a.findings ? (a.findings | slice:0:70) + (a.findings.length > 70 ? '...' : '') : '—' }}</td>
                <td class="text-sm text-muted">{{ a.date | date:'MMM d, y' }}</td>
                <td><span [class]="statusBadge(a.status)">{{ a.status }}</span></td>
                <td><button class="btn btn-ghost btn-sm" (click)="selected.set(a)">View</button></td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="6"><div class="empty-state"><p>No audits found</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div class="modal-backdrop" *ngIf="showForm()" (click)="closeForm()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>New Audit</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Audit Scope *</label>
            <input class="form-control" [(ngModel)]="form.scope" placeholder="e.g. Q1 2025 Full Safety Compliance Audit" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.date" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="form.status">
                <option>Planned</option><option>In Progress</option><option>Completed</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Findings</label>
            <textarea class="form-control" [(ngModel)]="form.findings" rows="3" placeholder="Record audit findings..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeForm()">Cancel</button>
          <button class="btn btn-primary" (click)="save()">Save Audit</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-backdrop" *ngIf="selected()" (click)="selected.set(null)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Audit Detail</h3>
          <button class="btn btn-ghost btn-sm" (click)="selected.set(null)">✕</button>
        </div>
        <div class="modal-body" *ngIf="selected() as a">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">ID</span><span>{{ a.auditId }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span [class]="statusBadge(a.status)">{{ a.status }}</span></div>
            <div class="detail-item full"><span class="detail-label">Scope</span><span>{{ a.scope }}</span></div>
            <div class="detail-item"><span class="detail-label">Auditor</span><span>{{ a.officerName }}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span>{{ a.date | date:'MMMM d, y' }}</span></div>
            <div class="detail-item full"><span class="detail-label">Findings</span><span>{{ a.findings || 'No findings recorded.' }}</span></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="selected.set(null)">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.fw-500{font-weight:500}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.detail-item{display:flex;flex-direction:column;gap:3px}.detail-item.full{grid-column:1/-1}.detail-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted)}`],
})
export class AuditListComponent {
  private data = inject(MockDataService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  showForm = signal(false);
  selected = signal<Audit | null>(null);
  form: Partial<Audit> = {};

  canAdd = computed(() => this.auth.hasRole('Compliance Officer', 'Administrator'));

  filtered = computed(() => {
    let list = this.data.audits();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(a => a.scope.toLowerCase().includes(q) || a.findings.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(a => a.status === this.filterStatus);
    return list;
  });

  openForm(): void {
    this.form = { status: 'Planned', date: new Date().toISOString().split('T')[0] };
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (!this.form.scope) return;
    const user = this.auth.currentUser();
    this.data.addAudit({ ...this.form, auditId: 'a' + Date.now(), officerId: user?.userId ?? '', officerName: user?.name ?? '', findings: this.form.findings ?? '' } as Audit);
    this.closeForm();
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = { Planned: 'badge badge-primary', 'In Progress': 'badge badge-warning', Completed: 'badge badge-success', Cancelled: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }
}

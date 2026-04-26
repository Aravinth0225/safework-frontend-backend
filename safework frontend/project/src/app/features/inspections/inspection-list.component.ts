import { Component, computed, signal, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Inspection } from '../../core/models';

@Component({
  selector: 'app-inspection-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, SlicePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Inspections</div>
          <div class="page-subtitle">Schedule and track workplace safety inspections</div>
        </div>
        <button class="btn btn-primary" *ngIf="canAdd()" (click)="openForm()">+ Schedule Inspection</button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search by location, findings..." />
            </div>
            <select class="form-control" style="width:160px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
            </select>
            <select class="form-control" style="width:140px" [(ngModel)]="filterType">
              <option value="">All Types</option>
              <option>Routine</option><option>Compliance</option><option>Special</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Location</th><th>Type</th><th>Findings</th><th>Officer</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let ins of filtered()">
                <td class="fw-500">{{ ins.location }}</td>
                <td><span class="badge badge-primary">{{ ins.type }}</span></td>
                <td style="max-width:220px" class="text-sm text-muted">{{ ins.findings ? (ins.findings | slice:0:60) + (ins.findings.length > 60 ? '...' : '') : '—' }}</td>
                <td class="text-sm">{{ ins.officerName }}</td>
                <td class="text-sm text-muted">{{ ins.date | date:'MMM d, y' }}</td>
                <td><span [class]="statusBadge(ins.status)">{{ ins.status }}</span></td>
                <td>
                  <button class="btn btn-ghost btn-sm" (click)="selected.set(ins)">View</button>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="7"><div class="empty-state"><p>No inspections found</p></div></td>
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
          <h3>Schedule Inspection</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location *</label>
              <input class="form-control" [(ngModel)]="form.location" placeholder="Building/Area" />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-control" [(ngModel)]="form.type">
                <option>Routine</option><option>Compliance</option><option>Special</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.date" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="form.status">
                <option>Scheduled</option><option>In Progress</option><option>Completed</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Findings / Notes</label>
            <textarea class="form-control" [(ngModel)]="form.findings" rows="3" placeholder="Document inspection findings..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeForm()">Cancel</button>
          <button class="btn btn-primary" (click)="save()">Save</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-backdrop" *ngIf="selected()" (click)="selected.set(null)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Inspection Detail</h3>
          <button class="btn btn-ghost btn-sm" (click)="selected.set(null)">✕</button>
        </div>
        <div class="modal-body" *ngIf="selected() as ins">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">ID</span><span>{{ ins.inspectionId }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span [class]="statusBadge(ins.status)">{{ ins.status }}</span></div>
            <div class="detail-item"><span class="detail-label">Location</span><span>{{ ins.location }}</span></div>
            <div class="detail-item"><span class="detail-label">Type</span><span>{{ ins.type }}</span></div>
            <div class="detail-item"><span class="detail-label">Officer</span><span>{{ ins.officerName }}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span>{{ ins.date | date:'MMMM d, y' }}</span></div>
            <div class="detail-item full"><span class="detail-label">Findings</span><span>{{ ins.findings || 'No findings recorded yet.' }}</span></div>
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
export class InspectionListComponent {
  private data = inject(MockDataService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  filterType = '';
  showForm = signal(false);
  selected = signal<Inspection | null>(null);
  form: Partial<Inspection> = {};

  canAdd = computed(() => this.auth.hasRole('Safety Officer', 'Hazard Officer', 'Administrator'));

  filtered = computed(() => {
    let list = this.data.inspections();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(i => i.location.toLowerCase().includes(q) || i.findings.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(i => i.status === this.filterStatus);
    if (this.filterType) list = list.filter(i => i.type === this.filterType);
    return list;
  });

  openForm(): void {
    this.form = { status: 'Scheduled', type: 'Routine', date: new Date().toISOString().split('T')[0] };
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (!this.form.location || !this.form.date) return;
    const user = this.auth.currentUser();
    this.data.addInspection({
      ...this.form,
      inspectionId: 'ins' + Date.now(),
      officerId: user?.userId ?? '',
      officerName: user?.name ?? '',
      findings: this.form.findings ?? '',
    } as Inspection);
    this.closeForm();
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = { Scheduled: 'badge badge-primary', 'In Progress': 'badge badge-warning', Completed: 'badge badge-success', Cancelled: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }
}

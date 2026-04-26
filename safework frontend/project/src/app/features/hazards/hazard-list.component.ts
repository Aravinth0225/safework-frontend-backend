import { Component, computed, signal, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Hazard, HazardSeverity, HazardStatus } from '../../core/models';

@Component({
  selector: 'app-hazard-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, SlicePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Hazard Reports</div>
          <div class="page-subtitle">Report and track workplace hazards</div>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Report Hazard</button>
      </div>

      <!-- Summary badges -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
        <div *ngFor="let s of summaryStats()" class="summary-chip" (click)="filterStatus = s.status; filterStatus = s.status">
          <span [class]="s.cls">{{ s.status }}</span>
          <span class="chip-count">{{ s.count }}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search hazards..." />
            </div>
            <select class="form-control" style="width:160px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Open</option><option>Under Investigation</option><option>Resolved</option><option>Closed</option>
            </select>
            <select class="form-control" style="width:140px" [(ngModel)]="filterSeverity">
              <option value="">All Severity</option>
              <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Description</th><th>Location</th><th>Reported By</th><th>Date</th><th>Severity</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of filtered()">
                <td style="max-width:260px">
                  <div class="fw-500">{{ h.description | slice:0:60 }}{{ h.description.length > 60 ? '...' : '' }}</div>
                  <div class="text-sm text-muted">{{ h.category }}</div>
                </td>
                <td class="text-sm">{{ h.location }}</td>
                <td class="text-sm">{{ h.employeeName }}</td>
                <td class="text-sm text-muted">{{ h.date | date:'MMM d, y' }}</td>
                <td><span [class]="severityBadge(h.severity)">{{ h.severity }}</span></td>
                <td><span [class]="statusBadge(h.status)">{{ h.status }}</span></td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" (click)="viewDetail(h)">View</button>
                    <button *ngIf="canUpdateStatus()" class="btn btn-outline btn-sm" (click)="openStatusModal(h)">Update</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="7"><div class="empty-state"><p>No hazard reports found</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Report Hazard Modal -->
    <div class="modal-backdrop" *ngIf="showForm()" (click)="closeForm()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Report a Hazard</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning"><span>⚠</span> Report all hazards immediately. Critical hazards will be escalated automatically.</div>
          <div class="form-group">
            <label class="form-label">Hazard Description *</label>
            <textarea class="form-control" [(ngModel)]="form.description" rows="3" placeholder="Describe the hazard clearly and specifically..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Location *</label>
              <input class="form-control" [(ngModel)]="form.location" placeholder="Building/Area/Station" />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-control" [(ngModel)]="form.category">
                <option>Electrical</option><option>Slip/Fall</option><option>Machinery</option><option>Chemical</option><option>Fire Safety</option><option>Structural</option><option>PPE</option><option>Ergonomic</option><option>Other</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Severity *</label>
              <select class="form-control" [(ngModel)]="form.severity">
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date Observed</label>
              <input type="date" class="form-control" [(ngModel)]="form.date" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeForm()">Cancel</button>
          <button class="btn btn-primary" (click)="save()">Submit Report</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-backdrop" *ngIf="selected()" (click)="selected.set(null)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Hazard Detail</h3>
          <button class="btn btn-ghost btn-sm" (click)="selected.set(null)">✕</button>
        </div>
        <div class="modal-body" *ngIf="selected() as h">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">ID</span><span>{{ h.hazardId }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span [class]="statusBadge(h.status)">{{ h.status }}</span></div>
            <div class="detail-item"><span class="detail-label">Severity</span><span [class]="severityBadge(h.severity)">{{ h.severity }}</span></div>
            <div class="detail-item"><span class="detail-label">Category</span><span>{{ h.category }}</span></div>
            <div class="detail-item full"><span class="detail-label">Description</span><span>{{ h.description }}</span></div>
            <div class="detail-item"><span class="detail-label">Location</span><span>{{ h.location }}</span></div>
            <div class="detail-item"><span class="detail-label">Reported By</span><span>{{ h.employeeName }}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span>{{ h.date | date:'MMMM d, y' }}</span></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="selected.set(null)">Close</button>
        </div>
      </div>
    </div>

    <!-- Status Update Modal -->
    <div class="modal-backdrop" *ngIf="statusTarget()" (click)="statusTarget.set(null)">
      <div class="modal" style="max-width:400px" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Update Status</h3>
          <button class="btn btn-ghost btn-sm" (click)="statusTarget.set(null)">✕</button>
        </div>
        <div class="modal-body" *ngIf="statusTarget() as h">
          <p class="text-muted" style="font-size:13px;margin-bottom:8px">{{ h.description | slice:0:80 }}</p>
          <div class="form-group">
            <label class="form-label">New Status</label>
            <select class="form-control" [(ngModel)]="newStatus">
              <option>Open</option><option>Under Investigation</option><option>Resolved</option><option>Closed</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="statusTarget.set(null)">Cancel</button>
          <button class="btn btn-primary" (click)="applyStatus()">Update</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fw-500{font-weight:500}
    .summary-chip{display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:4px 10px 4px 4px;cursor:pointer;}
    .chip-count{font-size:13px;font-weight:600;color:var(--text);}
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    .detail-item{display:flex;flex-direction:column;gap:3px;}
    .detail-item.full{grid-column:1/-1;}
    .detail-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);}
  `],
})
export class HazardListComponent {
  private data = inject(MockDataService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  filterSeverity = '';
  showForm = signal(false);
  selected = signal<Hazard | null>(null);
  statusTarget = signal<Hazard | null>(null);
  newStatus: HazardStatus = 'Open';
  form: Partial<Hazard> = {};

  canUpdateStatus = computed(() => this.auth.hasRole('Safety Officer', 'Hazard Officer', 'Manager', 'Administrator'));

  filtered = computed(() => {
    let list = this.data.hazards();
    if (this.auth.hasRole('Employee')) {
      const uid = this.auth.currentUser()?.userId ?? '';
      const empId = this.data.employees().find(e => e.userId === uid)?.employeeId ?? '';
      list = list.filter(h => h.employeeId === empId);
    }
    const q = this.search.toLowerCase();
    if (q) list = list.filter(h => h.description.toLowerCase().includes(q) || h.location.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(h => h.status === this.filterStatus);
    if (this.filterSeverity) list = list.filter(h => h.severity === this.filterSeverity);
    return list;
  });

  summaryStats = computed(() => {
    const h = this.data.hazards();
    return [
      { status: 'Open', count: h.filter(x => x.status === 'Open').length, cls: 'badge badge-danger' },
      { status: 'Under Investigation', count: h.filter(x => x.status === 'Under Investigation').length, cls: 'badge badge-warning' },
      { status: 'Resolved', count: h.filter(x => x.status === 'Resolved').length, cls: 'badge badge-success' },
      { status: 'Closed', count: h.filter(x => x.status === 'Closed').length, cls: 'badge badge-neutral' },
    ];
  });

  openForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = { severity: 'Medium', category: 'Other', date: today, status: 'Open' };
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (!this.form.description || !this.form.location) return;
    const user = this.auth.currentUser();
    const emp = this.data.employees().find(e => e.userId === user?.userId);
    this.data.addHazard({
      ...this.form,
      hazardId: 'h' + Date.now(),
      employeeId: emp?.employeeId ?? 'e1',
      employeeName: user?.name ?? 'Unknown',
      status: 'Open',
    } as Hazard);
    this.closeForm();
  }

  viewDetail(h: Hazard): void { this.selected.set(h); }

  openStatusModal(h: Hazard): void {
    this.statusTarget.set(h);
    this.newStatus = h.status;
  }

  applyStatus(): void {
    const h = this.statusTarget();
    if (!h) return;
    this.data.updateHazard({ ...h, status: this.newStatus });
    this.statusTarget.set(null);
  }

  severityBadge(s: string): string {
    const map: Record<string, string> = { Critical: 'badge badge-danger', High: 'badge badge-warning', Medium: 'badge badge-info', Low: 'badge badge-neutral' };
    return map[s] ?? 'badge badge-neutral';
  }
  statusBadge(s: string): string {
    const map: Record<string, string> = { Open: 'badge badge-danger', 'Under Investigation': 'badge badge-warning', Resolved: 'badge badge-success', Closed: 'badge badge-neutral' };
    return map[s] ?? 'badge badge-neutral';
  }
}

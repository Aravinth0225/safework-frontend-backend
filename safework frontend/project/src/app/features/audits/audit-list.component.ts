import { Component, computed, signal, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth.service';

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
              <tr><th>Title</th><th>Scope</th><th>Findings</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of filtered()">
                <td class="fw-500">{{ a.auditTitle }}</td>
                <td class="text-sm">{{ formatStatus(a.auditScope) }}</td>
                <td style="max-width:240px" class="text-sm text-muted">{{ a.auditFinding ? (a.auditFinding | slice:0:70) + (a.auditFinding.length > 70 ? '...' : '') : '—' }}</td>
                <td class="text-sm text-muted">{{ a.auditDate | date:'MMM d, y' }}</td>
                <td><span [class]="statusBadge(a.auditStatus)">{{ formatStatus(a.auditStatus) }}</span></td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" (click)="selected.set(a)">View</button>
                    <button *ngIf="canAdd()" class="btn btn-ghost btn-sm" (click)="editAudit(a)">Edit</button>
                    <button *ngIf="canAdd()" class="btn btn-ghost btn-sm text-danger" (click)="deleteAudit(a.auditId)">Delete</button>
                  </div>
                </td>
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
          <h3>{{ editingAuditId ? 'Edit' : 'New' }} Audit</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Audit Title *</label>
              <input class="form-control" [(ngModel)]="form.auditTitle" placeholder="e.g. Q1 Safety Audit 2026" />
            </div>
            <div class="form-group">
              <label class="form-label">Scope *</label>
              <select class="form-control" [(ngModel)]="form.auditScope">
                <option value="FULL_SITE">Full Site</option>
                <option value="SECTIONAL">Sectional</option>
                <option value="INDIVIDUAL_STATION">Individual Station</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input class="form-control" [(ngModel)]="form.auditDescription" placeholder="Quarterly workplace safety review" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.auditDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="form.auditStatus">
                <option value="Pending">Pending</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Findings</label>
            <textarea class="form-control" [(ngModel)]="form.auditFinding" rows="3" placeholder="Record audit findings..."></textarea>
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
            <div class="detail-item"><span class="detail-label">Status</span><span [class]="statusBadge(a.auditStatus)">{{ formatStatus(a.auditStatus) }}</span></div>
            <div class="detail-item full"><span class="detail-label">Title</span><span>{{ a.auditTitle }}</span></div>
            <div class="detail-item full"><span class="detail-label">Description</span><span>{{ a.auditDescription }}</span></div>
            <div class="detail-item"><span class="detail-label">Scope</span><span>{{ formatStatus(a.auditScope) }}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span>{{ a.auditDate | date:'MMMM d, y' }}</span></div>
            <div class="detail-item full"><span class="detail-label">Findings</span><span>{{ a.auditFinding || 'No findings recorded.' }}</span></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="selected.set(null)">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.fw-500{font-weight:500}.text-danger{color: var(--danger)}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.detail-item{display:flex;flex-direction:column;gap:3px}.detail-item.full{grid-column:1/-1}.detail-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted)}`],
})
export class AuditListComponent {
  private auditService = inject(AuditService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  showForm = signal(false);
  selected = signal<any | null>(null);
  form: any = {};
  editingAuditId: number | null = null;
  audits = signal<any[]>([]);

  canAdd = computed(() => this.auth.hasRole('Compliance Officer', 'Administrator'));

  ngOnInit() {
    this.loadAudits();
  }

  async loadAudits() {
    try {
      const data = await this.auditService.getAllAudits();
      this.audits.set(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  filtered = computed(() => {
    let list = this.audits();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(a => a.auditTitle?.toLowerCase().includes(q) || a.auditFinding?.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(a => a.auditStatus === this.filterStatus);
    return list;
  });

  openForm(): void {
    this.form = { auditStatus: 'Pending', auditScope: 'SECTIONAL', auditDate: new Date().toISOString().split('T')[0] };
    this.editingAuditId = null;
    this.showForm.set(true);
  }

  editAudit(a: any): void {
    this.form = { ...a };
    if (this.form.auditDate) {
      this.form.auditDate = new Date(this.form.auditDate).toISOString().split('T')[0];
    }
    this.editingAuditId = a.auditId;
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  async save() {
    if (!this.form.auditTitle || !this.form.auditScope || !this.form.auditDate) return;
    try {
      if (this.editingAuditId) {
        await this.auditService.updateAudit(this.editingAuditId, this.form);
      } else {
        await this.auditService.createAudit(this.form);
      }
      this.closeForm();
      this.loadAudits();
    } catch (e) {
      console.error('Failed to save audit', e);
    }
  }

  async deleteAudit(id: number) {
    if (confirm('Are you sure you want to delete this audit?')) {
      try {
        await this.auditService.deleteAudit(id);
        this.loadAudits();
      } catch (e) {
        console.error('Failed to delete audit', e);
      }
    }
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = { Pending: 'badge badge-primary', Open: 'badge badge-warning', Closed: 'badge badge-success' };
    return map[s] ?? 'badge badge-neutral';
  }

  formatStatus(s: string): string {
    if (!s) return '';
    return s.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}

import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceRecordService } from '../../core/services/compliance-record.service';
import { AuditService } from '../../core/services/audit.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-compliance-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, SlicePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Compliance Records</div>
          <div class="page-subtitle">Monitor compliance status across all categories</div>
        </div>
        <button class="btn btn-primary" *ngIf="canAdd()" (click)="openForm()">+ New Record</button>
      </div>

      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-icon" style="background:#d1fae5">✓</div>
          <div class="stat-value">{{ pass() }}</div>
          <div class="stat-label">Pass</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7">~</div>
          <div class="stat-value">{{ partial() }}</div>
          <div class="stat-label">Partial</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fee2e2">✗</div>
          <div class="stat-value">{{ fail() }}</div>
          <div class="stat-label">Fail</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe">📊</div>
          <div class="stat-value">{{ rate() }}%</div>
          <div class="stat-label">Compliance Rate</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search compliance records..." />
            </div>
            <select class="form-control" style="width:150px" [(ngModel)]="filterResult">
              <option value="">All Results</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="NON_COMPLIANT">Non Compliant</option>
              <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
              <option value="NOT_APPLICABLE">Not Applicable</option>
            </select>
            <select class="form-control" style="width:140px" [(ngModel)]="filterType">
              <option value="">All Entities</option>
              <option value="Hazard">Hazard</option>
              <option value="Inspection">Inspection</option>
              <option value="Program">Program</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Title</th><th>Audit ID</th><th>Entity Type</th><th>Result</th><th>Notes</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filtered()">
                <td class="fw-500">{{ c.complianceTitle }}</td>
                <td>Audit #{{ c.auditId }}</td>
                <td><span class="badge badge-primary">{{ c.entityType }}</span></td>
                <td><span [class]="resultBadge(c.complianceResult)">{{ formatResult(c.complianceResult) }}</span></td>
                <td style="max-width:280px" class="text-sm text-muted">{{ c.complianceNotes ? (c.complianceNotes | slice:0:80) + (c.complianceNotes.length > 80 ? '...' : '') : '—' }}</td>
                <td class="text-sm text-muted">{{ c.complianceDate | date:'MMM d, y' }}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button *ngIf="canAdd()" class="btn btn-ghost btn-sm" (click)="editRecord(c)">Edit</button>
                    <button *ngIf="canAdd()" class="btn btn-ghost btn-sm text-danger" (click)="deleteRecord(c.complianceId)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="6"><div class="empty-state"><p>No compliance records found</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div class="modal-backdrop" *ngIf="showForm()" (click)="closeForm()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingRecordId ? 'Edit' : 'New' }} Compliance Record</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Audit *</label>
              <select class="form-control" [(ngModel)]="form.auditId" [disabled]="!!editingRecordId">
                <option [ngValue]="null">Select Audit</option>
                <option *ngFor="let a of audits()" [ngValue]="a.auditId">
                  #{{ a.auditId }} - {{ a.auditTitle }} ({{ a.auditDate | date:'shortDate' }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Compliance Title *</label>
              <input class="form-control" [(ngModel)]="form.complianceTitle" placeholder="e.g. Fire Safety Check" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Entity Type</label>
              <select class="form-control" [(ngModel)]="form.entityType">
                <option value="Hazard">Hazard</option>
                <option value="Inspection">Inspection</option>
                <option value="Program">Program</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.complianceDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Result *</label>
              <select class="form-control" [(ngModel)]="form.complianceResult">
                <option value="COMPLIANT">Compliant</option>
                <option value="NON_COMPLIANT">Non Compliant</option>
                <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
                <option value="NOT_APPLICABLE">Not Applicable</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes *</label>
            <textarea class="form-control" [(ngModel)]="form.complianceNotes" rows="3" placeholder="Enter notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeForm()">Cancel</button>
          <button class="btn btn-primary" (click)="save()">Save Record</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.fw-500{font-weight:500}.text-danger{color: var(--danger)}`],
})
export class ComplianceListComponent implements OnInit {
  private complianceService = inject(ComplianceRecordService);
  private auditService = inject(AuditService);
  private auth = inject(AuthService);

  search = '';
  filterResult = '';
  filterType = '';
  showForm = signal(false);
  form: any = {};
  editingRecordId: number | null = null;

  records = signal<any[]>([]);
  audits = signal<any[]>([]);

  canAdd = computed(() => this.auth.hasRole('Compliance Officer', 'Administrator'));

  ngOnInit() {
    this.loadRecords();
    this.loadAudits();
  }

  async loadRecords() {
    try {
      const data = await this.complianceService.getAllComplianceRecords();
      this.records.set(data || []);
    } catch (e) {
      console.error(e);
    }
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
    let list = this.records();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(c => c.complianceTitle?.toLowerCase().includes(q) || c.complianceNotes?.toLowerCase().includes(q));
    if (this.filterResult) list = list.filter(c => c.complianceResult === this.filterResult);
    if (this.filterType) list = list.filter(c => c.entityType === this.filterType);
    return list;
  });

  pass = computed(() => this.records().filter(c => c.complianceResult === 'COMPLIANT').length);
  partial = computed(() => this.records().filter(c => c.complianceResult === 'PARTIALLY_COMPLIANT').length);
  fail = computed(() => this.records().filter(c => c.complianceResult === 'NON_COMPLIANT').length);
  rate = computed(() => {
    const t = this.records().length;
    return t ? Math.round((this.pass() / t) * 100) : 0;
  });

  openForm(): void {
    this.form = { complianceResult: 'COMPLIANT', entityType: 'Inspection', complianceDate: new Date().toISOString().split('T')[0], auditId: null };
    this.editingRecordId = null;
    this.showForm.set(true);
  }

  editRecord(c: any): void {
    this.form = { ...c };
    if (this.form.complianceDate) {
      this.form.complianceDate = new Date(this.form.complianceDate).toISOString().split('T')[0];
    }
    this.editingRecordId = c.complianceId;
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  async save() {
    if (!this.form.auditId || !this.form.complianceTitle) return;
    try {
      if (this.editingRecordId) {
        await this.complianceService.updateComplianceRecord(this.editingRecordId, this.form);
      } else {
        await this.complianceService.createComplianceRecord(this.form);
      }
      this.closeForm();
      this.loadRecords();
    } catch (e) {
      console.error('Failed to save compliance record', e);
    }
  }

  async deleteRecord(id: number) {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await this.complianceService.deleteComplianceRecord(id);
        this.loadRecords();
      } catch (e) {
        console.error('Failed to delete compliance record', e);
      }
    }
  }

  resultBadge(r: string): string {
    const map: Record<string, string> = { COMPLIANT: 'badge badge-success', NON_COMPLIANT: 'badge badge-danger', PARTIALLY_COMPLIANT: 'badge badge-warning', NOT_APPLICABLE: 'badge badge-neutral' };
    return map[r] ?? 'badge badge-neutral';
  }

  formatResult(s: string): string {
    if (!s) return '';
    return s.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}

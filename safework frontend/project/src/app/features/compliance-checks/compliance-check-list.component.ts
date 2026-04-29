import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceCheckService, ComplianceResponseDTO, ComplianceRequestDTO } from '../../core/services/compliance-check.service';
import { InspectionService, InspectionResponseDTO } from '../../core/services/inspection.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-compliance-check-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, SlicePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Compliance Checks</div>
          <div class="page-subtitle">Review inspection compliance outcomes</div>
        </div>
        <button class="btn btn-primary" *ngIf="canAdd()" (click)="openForm()">+ Create Check</button>
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
          <div class="stat-icon" style="background:#dbeafe">📋</div>
          <div class="stat-value">{{ complianceChecks().length }}</div>
          <div class="stat-label">Total Checks</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search checks..." />
            </div>
            <select class="form-control" style="width:140px" [(ngModel)]="filterResult">
              <option value="">All Results</option>
              <option value="PASS">Pass</option>
              <option value="PARTIAL">Partial</option>
              <option value="FAIL">Fail</option>
            </select>
            <select class="form-control" style="width:140px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Inspection ID</th><th>Result</th><th>Notes</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filtered()">
                <td class="fw-500">Insp #{{ c.inspectionId }}</td>
                <td><span [class]="resultBadge(c.complianceCheckResult)">{{ formatResult(c.complianceCheckResult) }}</span></td>
                <td style="max-width:280px" class="text-sm text-muted">{{ c.complianceCheckNotes ? (c.complianceCheckNotes | slice:0:80) + (c.complianceCheckNotes.length > 80 ? '...' : '') : '—' }}</td>
                <td class="text-sm text-muted">{{ c.complianceCheckDate | date:'MMM d, y' }}</td>
                <td><span [class]="statusBadge(c.complianceCheckStatus)">{{ formatResult(c.complianceCheckStatus) }}</span></td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button *ngIf="canAdd()" class="btn btn-ghost btn-sm" (click)="editCheck(c)">Edit</button>
                    <button *ngIf="canDelete()" class="btn btn-ghost btn-sm text-danger" (click)="deleteCheck(c.checkId)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="6"><div class="empty-state"><p>No compliance checks found</p></div></td>
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
          <h3>{{ editingCheckId ? 'Edit' : 'Create' }} Compliance Check</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Inspection *</label>
              <select class="form-control" [(ngModel)]="form.inspectionId" [disabled]="!!editingCheckId">
                <option [ngValue]="null">Select Inspection</option>
                <option *ngFor="let ins of inspections()" [ngValue]="ins.inspectionId">
                  #{{ ins.inspectionId }} - {{ ins.inspectionLocation }} ({{ ins.inspectionDate | date:'shortDate' }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Result *</label>
              <select class="form-control" [(ngModel)]="form.complianceCheckResult">
                <option value="PASS">Pass</option>
                <option value="PARTIAL">Partial</option>
                <option value="FAIL">Fail</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.complianceCheckDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Status *</label>
              <select class="form-control" [(ngModel)]="form.complianceCheckStatus">
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea class="form-control" [(ngModel)]="form.complianceCheckNotes" rows="3" placeholder="Enter compliance notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeForm()">Cancel</button>
          <button class="btn btn-primary" (click)="save()">Save</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.fw-500{font-weight:500}.text-danger{color: var(--danger)}`],
})
export class ComplianceCheckListComponent implements OnInit {
  private complianceService = inject(ComplianceCheckService);
  private inspectionService = inject(InspectionService);
  private auth = inject(AuthService);

  search = '';
  filterResult = '';
  filterStatus = '';
  showForm = signal(false);
  form: Partial<ComplianceRequestDTO> = {};
  editingCheckId: number | null = null;

  complianceChecks = signal<ComplianceResponseDTO[]>([]);
  inspections = signal<InspectionResponseDTO[]>([]);

  canAdd = computed(() => this.auth.hasRole('Safety Officer', 'Administrator', 'Hazard Officer'));
  canDelete = computed(() => this.auth.hasRole('Safety Officer', 'Administrator'));

  ngOnInit() {
    this.loadChecks();
    this.loadInspections();
  }

  async loadChecks() {
    try {
      const data = await this.complianceService.getAllChecks();
      this.complianceChecks.set(data || []);
    } catch (e) {
      console.error('Failed to load compliance checks', e);
    }
  }

  async loadInspections() {
    try {
      const data = await this.inspectionService.getAllInspections();
      this.inspections.set(data || []);
    } catch (e) {
      console.error('Failed to load inspections', e);
    }
  }

  pass = computed(() => this.complianceChecks().filter(c => c.complianceCheckResult === 'PASS').length);
  partial = computed(() => this.complianceChecks().filter(c => c.complianceCheckResult === 'PARTIAL').length);
  fail = computed(() => this.complianceChecks().filter(c => c.complianceCheckResult === 'FAIL').length);

  filtered = computed(() => {
    let list = this.complianceChecks();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(c => c.complianceCheckNotes?.toLowerCase().includes(q) || String(c.inspectionId).includes(q));
    if (this.filterResult) list = list.filter(c => c.complianceCheckResult === this.filterResult);
    if (this.filterStatus) list = list.filter(c => c.complianceCheckStatus === this.filterStatus);
    return list;
  });

  openForm(): void {
    this.form = { complianceCheckResult: 'PASS', complianceCheckStatus: 'OPEN', complianceCheckDate: new Date().toISOString().split('T')[0], inspectionId: null as any };
    this.editingCheckId = null;
    this.showForm.set(true);
  }

  editCheck(c: ComplianceResponseDTO): void {
    this.form = { ...c };
    if (this.form.complianceCheckDate) {
       this.form.complianceCheckDate = new Date(this.form.complianceCheckDate).toISOString().split('T')[0];
    }
    this.editingCheckId = c.checkId;
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  async save() {
    if (!this.form.inspectionId || !this.form.complianceCheckDate || !this.form.complianceCheckResult) return;
    try {
      const dto = this.form as ComplianceRequestDTO;
      if (this.editingCheckId) {
        await this.complianceService.updateCheck(this.editingCheckId, dto);
      } else {
        await this.complianceService.createCheck(dto);
      }
      this.closeForm();
      this.loadChecks();
    } catch (e) {
      console.error('Failed to save compliance check', e);
    }
  }

  async deleteCheck(id: number) {
    if (confirm('Are you sure you want to delete this compliance check?')) {
      try {
        await this.complianceService.deleteCheck(id);
        this.loadChecks();
      } catch (e) {
        console.error('Failed to delete compliance check', e);
      }
    }
  }

  resultBadge(r: string): string {
    const map: Record<string, string> = { PASS: 'badge badge-success', PARTIAL: 'badge badge-warning', FAIL: 'badge badge-danger' };
    return map[r] ?? 'badge badge-neutral';
  }
  
  statusBadge(s: string): string {
    return s === 'CLOSED' ? 'badge badge-neutral' : 'badge badge-warning';
  }

  formatResult(s: string): string {
    if (!s) return '';
    return s.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}

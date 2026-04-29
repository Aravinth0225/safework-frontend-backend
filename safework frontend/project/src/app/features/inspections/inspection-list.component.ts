import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspectionService, InspectionResponseDTO, InspectionRequestDTO } from '../../core/services/inspection.service';
import { AuthService } from '../../core/services/auth.service';

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
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Location</th><th>Findings</th><th>Officer ID</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let ins of filtered()">
                <td class="fw-500">{{ ins.inspectionLocation }}</td>
                <td style="max-width:220px" class="text-sm text-muted">{{ ins.inspectionFindings ? (ins.inspectionFindings | slice:0:60) + (ins.inspectionFindings.length > 60 ? '...' : '') : '—' }}</td>
                <td class="text-sm">Emp #{{ ins.officerId }}</td>
                <td class="text-sm text-muted">{{ ins.inspectionDate | date:'MMM d, y' }}</td>
                <td><span [class]="statusBadge(ins.inspectionStatus)">{{ formatStatus(ins.inspectionStatus) }}</span></td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" (click)="selected.set(ins)">View</button>
                    <button *ngIf="canAdd()" class="btn btn-ghost btn-sm" (click)="editInspection(ins)">Edit</button>
                    <button *ngIf="canAdd()" class="btn btn-ghost btn-sm text-danger" (click)="deleteInspection(ins.inspectionId)">Delete</button>
                  </div>
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
              <input class="form-control" [(ngModel)]="form.inspectionLocation" placeholder="Building/Area" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="form.inspectionStatus">
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.inspectionDate" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Findings / Notes</label>
            <textarea class="form-control" [(ngModel)]="form.inspectionFindings" rows="3" placeholder="Document inspection findings..."></textarea>
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
            <div class="detail-item"><span class="detail-label">Status</span><span [class]="statusBadge(ins.inspectionStatus)">{{ formatStatus(ins.inspectionStatus) }}</span></div>
            <div class="detail-item"><span class="detail-label">Location</span><span>{{ ins.inspectionLocation }}</span></div>
            <div class="detail-item"><span class="detail-label">Officer ID</span><span>Emp #{{ ins.officerId }}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span>{{ ins.inspectionDate | date:'MMMM d, y' }}</span></div>
            <div class="detail-item full"><span class="detail-label">Findings</span><span>{{ ins.inspectionFindings || 'No findings recorded yet.' }}</span></div>
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
export class InspectionListComponent implements OnInit {
  private inspectionService = inject(InspectionService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  showForm = signal(false);
  selected = signal<InspectionResponseDTO | null>(null);
  form: Partial<InspectionRequestDTO> = {};
  editingInspectionId: number | null = null;

  inspections = signal<InspectionResponseDTO[]>([]);

  canAdd = computed(() => this.auth.hasRole('Safety Officer', 'Hazard Officer', 'Administrator'));

  ngOnInit() {
    this.loadInspections();
  }

  async loadInspections() {
    try {
      const data = await this.inspectionService.getAllInspections();
      this.inspections.set(data || []);
    } catch (error) {
      console.error('Failed to load inspections', error);
    }
  }

  filtered = computed(() => {
    let list = this.inspections();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(i => i.inspectionLocation?.toLowerCase().includes(q) || i.inspectionFindings?.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(i => i.inspectionStatus === this.filterStatus);
    return list;
  });

  openForm(): void {
    this.form = { inspectionStatus: 'SCHEDULED', inspectionDate: new Date().toISOString().split('T')[0] };
    this.editingInspectionId = null;
    this.showForm.set(true);
  }

  editInspection(ins: InspectionResponseDTO): void {
    this.form = { ...ins };
    if (this.form.inspectionDate) {
       this.form.inspectionDate = new Date(this.form.inspectionDate).toISOString().split('T')[0];
    }
    this.editingInspectionId = ins.inspectionId;
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  async save() {
    if (!this.form.inspectionLocation || !this.form.inspectionDate) return;
    try {
      const dto = this.form as InspectionRequestDTO;
      dto.officerId = Number(this.auth.currentUser()?.userId ?? 1);
      
      if (this.editingInspectionId) {
        await this.inspectionService.updateInspection(this.editingInspectionId, dto);
      } else {
        await this.inspectionService.createInspection(dto);
      }
      this.closeForm();
      this.loadInspections();
    } catch (error) {
      console.error('Failed to save inspection', error);
    }
  }

  async deleteInspection(id: number) {
    if (confirm('Are you sure you want to delete this inspection?')) {
      try {
        await this.inspectionService.deleteInspection(id);
        this.loadInspections();
      } catch (error) {
        console.error('Failed to delete inspection', error);
      }
    }
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = { SCHEDULED: 'badge badge-primary', IN_PROGRESS: 'badge badge-warning', COMPLETED: 'badge badge-success', CANCELLED: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }

  formatStatus(s: string): string {
    if (!s) return '';
    return s.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}

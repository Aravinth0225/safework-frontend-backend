import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HazardService, HazardReportProjection, HazardRequestDto } from '../../core/services/hazard.service';
import { AuthService } from '../../core/services/auth.service';
import { IncidentService, IncidentReportProjection } from '../../core/services/incident.service';

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
        <div *ngFor="let s of summaryStats()" class="summary-chip" (click)="filterStatus = s.status">
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
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Description</th><th>Location</th><th>Employee ID</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of filtered()">
                <td style="max-width:260px">
                  <div class="fw-500">{{ h.hazardDescription | slice:0:60 }}{{ h.hazardDescription.length > 60 ? '...' : '' }}</div>
                </td>
                <td class="text-sm">{{ h.hazardLocation }}</td>
                <td class="text-sm">Emp #{{ h.employeeId }}</td>
                <td class="text-sm text-muted">{{ h.hazardDate | date:'MMM d, y' }}</td>
                <td><span [class]="statusBadge(h.hazardStatus)">{{ h.hazardStatus }}</span></td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" (click)="viewDetail(h)">View</button>
                    <button *ngIf="canUpdateStatus()" class="btn btn-outline btn-sm" (click)="openStatusModal(h)">Update</button>
                    <button *ngIf="canUpdateStatus()" class="btn btn-ghost btn-sm text-danger" (click)="deleteHazard(h.hazardId)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="6"><div class="empty-state"><p>No hazard reports found</p></div></td>
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
            <textarea class="form-control" [(ngModel)]="form.hazardDescription" rows="3" placeholder="Describe the hazard clearly and specifically..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Location *</label>
            <input class="form-control" [(ngModel)]="form.hazardLocation" placeholder="Building/Area/Station" />
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
      <div class="modal" style="max-width: 600px;" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Hazard Detail</h3>
          <button class="btn btn-ghost btn-sm" (click)="selected.set(null)">✕</button>
        </div>
        <div class="modal-body" *ngIf="selected() as h">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">ID</span><span>{{ h.hazardId }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span [class]="statusBadge(h.hazardStatus)">{{ h.hazardStatus }}</span></div>
            <div class="detail-item full"><span class="detail-label">Description</span><span>{{ h.hazardDescription }}</span></div>
            <div class="detail-item"><span class="detail-label">Location</span><span>{{ h.hazardLocation }}</span></div>
            <div class="detail-item"><span class="detail-label">Reported By Emp ID</span><span>{{ h.employeeId }}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span>{{ h.hazardDate | date:'MMMM d, y' }}</span></div>
          </div>
          
          <div *ngIf="relatedIncident()" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
            <h4 style="margin-bottom: 12px; font-size: 14px; font-weight: 600;">Incident Resolution Actions</h4>
            <div class="detail-grid">
              <div class="detail-item full"><span class="detail-label">Actions Taken by Hazard Officer</span><span style="background:var(--surface);padding:8px;border-radius:4px;font-size:13px;border:1px solid var(--border);">{{ relatedIncident()?.action }}</span></div>
              <div class="detail-item"><span class="detail-label">Resolved By</span><span>Emp #{{ relatedIncident()?.officerId }}</span></div>
              <div class="detail-item"><span class="detail-label">Resolution Date</span><span>{{ relatedIncident()?.incidentDate | date:'MMMM d, y' }}</span></div>
            </div>
          </div>
          <div *ngIf="h.hazardStatus === 'COMPLETED' && relatedIncident() === null && loadingIncident()" style="margin-top: 24px;">
             <p class="text-sm text-muted">Loading incident details...</p>
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
          <p class="text-muted" style="font-size:13px;margin-bottom:8px">{{ h.hazardDescription | slice:0:80 }}</p>
          <div class="form-group">
            <label class="form-label">New Status</label>
            <select class="form-control" [(ngModel)]="newStatus">
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
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
    .text-danger{color: var(--danger)}
    .summary-chip{display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:4px 10px 4px 4px;cursor:pointer;}
    .chip-count{font-size:13px;font-weight:600;color:var(--text);}
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    .detail-item{display:flex;flex-direction:column;gap:3px;}
    .detail-item.full{grid-column:1/-1;}
    .detail-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);}
  `],
})
export class HazardListComponent implements OnInit {
  private hazardService = inject(HazardService);
  private incidentService = inject(IncidentService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  showForm = signal(false);
  selected = signal<HazardReportProjection | null>(null);
  relatedIncident = signal<IncidentReportProjection | null>(null);
  loadingIncident = signal<boolean>(false);
  statusTarget = signal<HazardReportProjection | null>(null);
  newStatus: string = 'PENDING';
  form: Partial<HazardRequestDto> = {};

  hazards = signal<HazardReportProjection[]>([]);

  canUpdateStatus = computed(() => this.auth.hasRole('Safety Officer', 'Hazard Officer', 'Manager', 'Administrator'));

  filtered = computed(() => {
    let list = this.hazards();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(h => h.hazardDescription?.toLowerCase().includes(q) || h.hazardLocation?.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(h => h.hazardStatus === this.filterStatus);
    return list;
  });

  summaryStats = computed(() => {
    const h = this.hazards();
    return [
      { status: 'PENDING', count: h.filter(x => x.hazardStatus === 'PENDING').length, cls: 'badge badge-warning' },
      { status: 'COMPLETED', count: h.filter(x => x.hazardStatus === 'COMPLETED').length, cls: 'badge badge-success' },
    ];
  });

  ngOnInit() {
    this.loadHazards();
  }

  async loadHazards() {
    try {
      if (this.auth.hasRole('Employee')) {
        const uid = Number(this.auth.currentUser()?.userId ?? 0);
        const data = await this.hazardService.getHazardsByEmployee(uid);
        this.hazards.set(data || []);
      } else {
        const data = await this.hazardService.getAllHazards();
        this.hazards.set(data || []);
      }
    } catch (error) {
      console.error('Failed to load hazards', error);
    }
  }

  openForm(): void {
    this.form = { hazardStatus: 'PENDING' };
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  async save() {
    if (!this.form.hazardDescription || !this.form.hazardLocation) return;
    try {
      const dto: HazardRequestDto = {
        hazardDescription: this.form.hazardDescription,
        hazardLocation: this.form.hazardLocation,
        hazardStatus: 'PENDING',
        employeeId: Number(this.auth.currentUser()?.userId ?? 0)
      };
      await this.hazardService.addHazard(dto);
      this.closeForm();
      this.loadHazards();
    } catch (error) {
      console.error('Failed to save hazard', error);
    }
  }

  async viewDetail(h: HazardReportProjection) {
    this.selected.set(h);
    this.relatedIncident.set(null);
    if (h.hazardStatus === 'COMPLETED') {
       this.loadingIncident.set(true);
       try {
         const incident = await this.incidentService.getIncidentByHazardId(h.hazardId);
         this.relatedIncident.set(incident);
       } catch (error) {
         console.warn('No incident found or failed to load incident details', error);
       } finally {
         this.loadingIncident.set(false);
       }
    }
  }

  openStatusModal(h: HazardReportProjection): void {
    this.statusTarget.set(h);
    this.newStatus = h.hazardStatus || 'PENDING';
  }

  async applyStatus() {
    const h = this.statusTarget();
    if (!h) return;
    try {
      const dto: HazardRequestDto = {
        employeeId: h.employeeId,
        hazardDescription: h.hazardDescription,
        hazardLocation: h.hazardLocation,
        hazardStatus: this.newStatus
      };
      await this.hazardService.updateHazard(h.hazardId, dto);
      this.statusTarget.set(null);
      this.loadHazards();
    } catch (error) {
      console.error('Failed to update hazard', error);
    }
  }

  async deleteHazard(hazardId: number) {
    if (confirm('Are you sure you want to delete this hazard?')) {
      try {
        await this.hazardService.deleteHazard(hazardId);
        this.loadHazards();
      } catch (error) {
        console.error('Failed to delete hazard', error);
      }
    }
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = { PENDING: 'badge badge-warning', COMPLETED: 'badge badge-success' };
    return map[s] ?? 'badge badge-neutral';
  }
}


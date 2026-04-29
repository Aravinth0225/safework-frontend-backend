import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService, IncidentReportProjection, IncidentRequestDto } from '../../core/services/incident.service';
import { HazardService, HazardReportProjection } from '../../core/services/hazard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, SlicePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Incidents</div>
          <div class="page-subtitle">Track and manage hazard incidents</div>
        </div>
        <button *ngIf="canManage()" class="btn btn-primary" (click)="openForm()">+ Create Incident</button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search incidents..." />
            </div>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Hazard</th><th>Actions Taken</th><th>Officer</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let i of filtered()">
                <td style="max-width:220px">
                  <div class="fw-500">{{ i.hazardDescription | slice:0:50 }}{{ (i.hazardDescription?.length ?? 0) > 50 ? '...' : '' }}</div>
                  <div class="text-sm text-muted">ID: {{ i.incidentId }}</div>
                </td>
                <td style="max-width:260px" class="text-sm">{{ i.action | slice:0:70 }}{{ (i.action?.length ?? 0) > 70 ? '...' : '' }}</td>
                <td class="text-sm">Emp #{{ i.officerId }}</td>
                <td class="text-sm text-muted">{{ i.incidentDate | date:'MMM d, y' }}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" (click)="selected.set(i)">View</button>
                    <button *ngIf="canManage()" class="btn btn-outline btn-sm" (click)="editIncident(i)">Edit</button>
                    <button *ngIf="canManage()" class="btn btn-ghost btn-sm text-danger" (click)="deleteIncident(i.incidentId)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="5"><div class="empty-state"><p>No incidents found</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Form Modal -->
    <div class="modal-backdrop" *ngIf="showForm()" (click)="closeForm()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editingIncidentId ? 'Edit' : 'Create' }} Incident</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group" *ngIf="!editingIncidentId">
            <label class="form-label">Select Hazard Report *</label>
            <select class="form-control" [(ngModel)]="form.hazardId">
              <option [ngValue]="null">-- Select a Hazard --</option>
              <option *ngFor="let h of availableHazards()" [value]="h.hazardId">
                ID: {{ h.hazardId }} - {{ h.hazardDescription | slice:0:40 }}... ({{ h.hazardStatus }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Actions Taken *</label>
            <textarea class="form-control" [(ngModel)]="form.action" rows="4" placeholder="Describe the actions taken to resolve this hazard..."></textarea>
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
          <h3>Incident Detail</h3>
          <button class="btn btn-ghost btn-sm" (click)="selected.set(null)">✕</button>
        </div>
        <div class="modal-body" *ngIf="selected() as i">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Incident ID</span><span>{{ i.incidentId }}</span></div>
            <div class="detail-item"><span class="detail-label">Hazard ID</span><span>{{ i.hazardId }}</span></div>
            <div class="detail-item full"><span class="detail-label">Hazard Description</span><span>{{ i.hazardDescription }}</span></div>
            <div class="detail-item full"><span class="detail-label">Actions Taken</span><span>{{ i.action }}</span></div>
            <div class="detail-item"><span class="detail-label">Officer</span><span>Emp #{{ i.officerId }}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span>{{ i.incidentDate | date:'MMMM d, y' }}</span></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="selected.set(null)">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fw-500{font-weight:500}
    .text-danger{color: var(--danger)}
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .detail-item{display:flex;flex-direction:column;gap:3px}
    .detail-item.full{grid-column:1/-1}
    .detail-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted)}
  `],
})
export class IncidentListComponent implements OnInit {
  private incidentService = inject(IncidentService);
  private hazardService = inject(HazardService);
  private auth = inject(AuthService);

  search = '';
  selected = signal<IncidentReportProjection | null>(null);
  showForm = signal(false);
  editingIncidentId: number | null = null;
  
  form = {
    hazardId: null as number | null,
    action: ''
  };

  incidents = signal<IncidentReportProjection[]>([]);
  availableHazards = signal<HazardReportProjection[]>([]);

  canManage = computed(() => this.auth.hasRole('Safety Officer', 'Hazard Officer', 'Administrator'));

  ngOnInit() {
    this.loadIncidents();
  }

  async loadIncidents() {
    try {
      const data = await this.incidentService.getAllIncidents();
      this.incidents.set(data || []);
    } catch (error) {
      console.error('Failed to load incidents', error);
    }
  }

  async loadAvailableHazards() {
    try {
      const allHazards = await this.hazardService.getAllHazards();
      // Filter out hazards that already have an incident
      const existingIncidentHazardIds = new Set(this.incidents().map(i => i.hazardId));
      this.availableHazards.set(allHazards.filter(h => !existingIncidentHazardIds.has(h.hazardId)));
    } catch (error) {
      console.error('Failed to load hazards', error);
    }
  }

  filtered = computed(() => {
    let list = this.incidents();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(i => i.hazardDescription?.toLowerCase().includes(q) || i.action?.toLowerCase().includes(q));
    return list;
  });

  async openForm() {
    this.form = { hazardId: null, action: '' };
    this.editingIncidentId = null;
    await this.loadAvailableHazards();
    this.showForm.set(true);
  }

  editIncident(incident: IncidentReportProjection) {
    this.editingIncidentId = incident.incidentId;
    this.form = { hazardId: incident.hazardId, action: incident.action };
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
  }

  async save() {
    if (!this.form.action) return;
    
    try {
      const dto: IncidentRequestDto = { action: this.form.action };
      
      if (this.editingIncidentId) {
        await this.incidentService.updateIncident(this.editingIncidentId, dto);
      } else {
        if (!this.form.hazardId) return;
        await this.incidentService.addIncident(this.form.hazardId, dto);
      }
      
      this.closeForm();
      this.loadIncidents();
    } catch (error) {
      console.error('Failed to save incident', error);
    }
  }

  async deleteIncident(incidentId: number) {
    if (confirm('Are you sure you want to delete this incident? The associated hazard will revert to PENDING status.')) {
      try {
        await this.incidentService.deleteIncident(incidentId);
        this.loadIncidents();
      } catch (error) {
        console.error('Failed to delete incident', error);
      }
    }
  }
}



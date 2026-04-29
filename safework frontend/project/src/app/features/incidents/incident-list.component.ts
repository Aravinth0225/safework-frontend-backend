import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService, IncidentReportProjection } from '../../core/services/incident.service';

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
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search incidents..." />
            </div>
            <select class="form-control" style="width:160px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Hazard</th><th>Actions Taken</th><th>Officer</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let i of filtered()">
                <td style="max-width:220px">
                  <div class="fw-500">{{ i.hazardDescription | slice:0:50 }}{{ (i.hazardDescription?.length ?? 0) > 50 ? '...' : '' }}</div>
                  <div class="text-sm text-muted">ID: {{ i.incidentId }}</div>
                </td>
                <td style="max-width:260px" class="text-sm">{{ i.actions | slice:0:70 }}{{ i.actions.length > 70 ? '...' : '' }}</td>
                <td class="text-sm">{{ i.officerName }}</td>
                <td class="text-sm text-muted">{{ i.date | date:'MMM d, y' }}</td>
                <td><span [class]="statusBadge(i.status)">{{ i.status }}</span></td>
                <td>
                  <button class="btn btn-ghost btn-sm" (click)="selected.set(i)">View</button>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="6"><div class="empty-state"><p>No incidents found</p></div></td>
              </tr>
            </tbody>
          </table>
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
            <div class="detail-item"><span class="detail-label">Status</span><span [class]="statusBadge(i.status)">{{ i.status }}</span></div>
            <div class="detail-item full"><span class="detail-label">Hazard</span><span>{{ i.hazardDescription }}</span></div>
            <div class="detail-item full"><span class="detail-label">Actions Taken</span><span>{{ i.actions }}</span></div>
            <div class="detail-item"><span class="detail-label">Officer</span><span>{{ i.officerName }}</span></div>
            <div class="detail-item"><span class="detail-label">Date</span><span>{{ i.date | date:'MMMM d, y' }}</span></div>
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
export class IncidentListComponent implements OnInit {
  private incidentService = inject(IncidentService);
  search = '';
  filterStatus = '';
  selected = signal<IncidentReportProjection | null>(null);

  incidents = signal<IncidentReportProjection[]>([]);

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

  filtered = computed(() => {
    let list = this.incidents();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(i => i.hazardDescription?.toLowerCase().includes(q) || i.actions.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(i => i.status === this.filterStatus);
    return list;
  });

  statusBadge(s: string): string {
    const map: Record<string, string> = { Open: 'badge badge-danger', 'In Progress': 'badge badge-warning', Resolved: 'badge badge-success', Closed: 'badge badge-neutral' };
    return map[s] ?? 'badge badge-neutral';
  }
}

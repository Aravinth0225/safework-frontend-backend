import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';

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
      </div>

      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-icon" style="background:#d1fae5">✓</div>
          <div class="stat-value">{{ compliant() }}</div>
          <div class="stat-label">Compliant</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7">~</div>
          <div class="stat-value">{{ partial() }}</div>
          <div class="stat-label">Partial</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fee2e2">✗</div>
          <div class="stat-value">{{ nonCompliant() }}</div>
          <div class="stat-label">Non-Compliant</div>
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
              <option>Compliant</option><option>Non-Compliant</option><option>Partial</option>
            </select>
            <select class="form-control" style="width:140px" [(ngModel)]="filterType">
              <option value="">All Types</option>
              <option>Hazard</option><option>Inspection</option><option>Program</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Entity</th><th>Type</th><th>Result</th><th>Notes</th><th>Date</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filtered()">
                <td class="fw-500">{{ c.entityDescription }}</td>
                <td><span class="badge badge-primary">{{ c.type }}</span></td>
                <td><span [class]="resultBadge(c.result)">{{ c.result }}</span></td>
                <td style="max-width:280px" class="text-sm text-muted">{{ c.notes | slice:0:80 }}{{ c.notes.length > 80 ? '...' : '' }}</td>
                <td class="text-sm text-muted">{{ c.date | date:'MMM d, y' }}</td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="5"><div class="empty-state"><p>No compliance records found</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.fw-500{font-weight:500}`],
})
export class ComplianceListComponent {
  private data = inject(MockDataService);
  search = '';
  filterResult = '';
  filterType = '';

  filtered = computed(() => {
    let list = this.data.complianceRecords();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(c => (c.entityDescription ?? '').toLowerCase().includes(q) || c.notes.toLowerCase().includes(q));
    if (this.filterResult) list = list.filter(c => c.result === this.filterResult);
    if (this.filterType) list = list.filter(c => c.type === this.filterType);
    return list;
  });

  compliant = computed(() => this.data.complianceRecords().filter(c => c.result === 'Compliant').length);
  partial = computed(() => this.data.complianceRecords().filter(c => c.result === 'Partial').length);
  nonCompliant = computed(() => this.data.complianceRecords().filter(c => c.result === 'Non-Compliant').length);
  rate = computed(() => {
    const t = this.data.complianceRecords().length;
    return t ? Math.round((this.compliant() / t) * 100) : 0;
  });

  resultBadge(r: string): string {
    const map: Record<string, string> = { Compliant: 'badge badge-success', 'Non-Compliant': 'badge badge-danger', Partial: 'badge badge-warning' };
    return map[r] ?? 'badge badge-neutral';
  }
}

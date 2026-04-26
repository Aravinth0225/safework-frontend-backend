import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';

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
          <div class="stat-value">{{ data.complianceChecks().length }}</div>
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
              <option>Pass</option><option>Partial</option><option>Fail</option>
            </select>
            <select class="form-control" style="width:140px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Open</option><option>Closed</option>
            </select>
          </div>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Inspection</th><th>Result</th><th>Notes</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filtered()">
                <td class="fw-500">{{ c.inspectionLocation }}</td>
                <td><span [class]="resultBadge(c.result)">{{ c.result }}</span></td>
                <td style="max-width:280px" class="text-sm text-muted">{{ c.notes | slice:0:80 }}{{ c.notes.length > 80 ? '...' : '' }}</td>
                <td class="text-sm text-muted">{{ c.date | date:'MMM d, y' }}</td>
                <td><span [class]="statusBadge(c.status)">{{ c.status }}</span></td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="5"><div class="empty-state"><p>No compliance checks found</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.fw-500{font-weight:500}`],
})
export class ComplianceCheckListComponent {
  data = inject(MockDataService);
  search = '';
  filterResult = '';
  filterStatus = '';

  pass = computed(() => this.data.complianceChecks().filter(c => c.result === 'Pass').length);
  partial = computed(() => this.data.complianceChecks().filter(c => c.result === 'Partial').length);
  fail = computed(() => this.data.complianceChecks().filter(c => c.result === 'Fail').length);

  filtered = computed(() => {
    let list = this.data.complianceChecks();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(c => c.notes.toLowerCase().includes(q) || (c.inspectionLocation ?? '').toLowerCase().includes(q));
    if (this.filterResult) list = list.filter(c => c.result === this.filterResult);
    if (this.filterStatus) list = list.filter(c => c.status === this.filterStatus);
    return list;
  });

  resultBadge(r: string): string {
    const map: Record<string, string> = { Pass: 'badge badge-success', Partial: 'badge badge-warning', Fail: 'badge badge-danger' };
    return map[r] ?? 'badge badge-neutral';
  }
  statusBadge(s: string): string {
    return s === 'Closed' ? 'badge badge-neutral' : 'badge badge-warning';
  }
}

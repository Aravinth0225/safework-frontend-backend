import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Audit Log</div>
          <div class="page-subtitle">Immutable record of all system actions</div>
        </div>
      </div>

      <div class="alert alert-info" style="margin-bottom:20px">
        <span>ℹ</span> The audit log provides a tamper-proof trail of all user actions across the system. Records are immutable and cannot be modified.
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search by user or action..." />
            </div>
            <select class="form-control" style="width:140px" [(ngModel)]="filterAction">
              <option value="">All Actions</option>
              <option>CREATE</option><option>UPDATE</option><option>DELETE</option><option>LOGIN</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} entries</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Action</th><th>Resource</th><th>User</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of filtered()">
                <td><span [class]="actionBadge(log.action)">{{ log.action }}</span></td>
                <td style="max-width:320px" class="text-sm">{{ log.resource }}</td>
                <td class="text-sm">{{ log.userName }}</td>
                <td class="text-sm text-muted">{{ log.timestamp | date:'MMM d, y HH:mm:ss' }}</td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="4"><div class="empty-state"><p>No log entries found</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class AuditLogComponent {
  private data = inject(MockDataService);
  search = '';
  filterAction = '';

  filtered = computed(() => {
    let list = [...this.data.auditLogs()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const q = this.search.toLowerCase();
    if (q) list = list.filter(l => l.userName.toLowerCase().includes(q) || l.resource.toLowerCase().includes(q) || l.action.toLowerCase().includes(q));
    if (this.filterAction) list = list.filter(l => l.action === this.filterAction);
    return list;
  });

  actionBadge(a: string): string {
    const map: Record<string, string> = { CREATE: 'badge badge-success', UPDATE: 'badge badge-info', DELETE: 'badge badge-danger', LOGIN: 'badge badge-neutral' };
    return map[a] ?? 'badge badge-neutral';
  }
}

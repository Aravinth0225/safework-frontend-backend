import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { Employee } from '../../core/models';

@Component({
  selector: 'app-employee-verification',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Employee Verification</div>
          <div class="page-subtitle">Approve newly registered employees to enable login access</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="text-muted text-sm">{{ pendingEmployees().length }} pending approvals</span>
        </div>
        <div class="alert alert-danger" style="margin:12px" *ngIf="error()">{{ error() }}</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of pendingEmployees()">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar">{{ initials(e.name) }}</div>
                    <div>
                      <div class="fw-600">{{ e.name }}</div>
                      <div class="text-sm text-muted">ID: {{ e.employeeId }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ e.department || '—' }}</td>
                <td>{{ e.email || '—' }}</td>
                <td><span class="badge badge-warning">Pending</span></td>
                <td>
                  <button class="btn btn-primary btn-sm" (click)="approve(e)">Approve</button>
                </td>
              </tr>
              <tr *ngIf="pendingEmployees().length === 0">
                <td colspan="5">
                  <div class="empty-state"><p>No pending employees for approval</p></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.avatar{width:34px;height:34px;border-radius:50%;background:var(--primary-lighter);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}.fw-600{font-weight:600}`],
})
export class EmployeeVerificationComponent {
  private data = inject(MockDataService);
  error = this.data.operationError;

  pendingEmployees = computed(() => this.data.employees().filter(e => e.status === 'Pending'));

  approve(employee: Employee): void {
    this.data.approveEmployee(employee.employeeId);
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}

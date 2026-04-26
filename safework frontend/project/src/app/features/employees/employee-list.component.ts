import { Component, computed, signal, inject } from '@angular/core';
import { NgFor, NgIf, NgClass, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { Employee } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, SlicePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Employees</div>
          <div class="page-subtitle">Manage employee profiles and documents</div>
        </div>
        <button class="btn btn-primary" (click)="openForm()" *ngIf="canEdit()">+ Add Employee</button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search by name, department..." />
            </div>
            <select class="form-control" style="width:160px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Active</option><option>Inactive</option><option>Pending</option><option>Terminated</option>
            </select>
            <select class="form-control" style="width:180px" [(ngModel)]="filterDept">
              <option value="">All Departments</option>
              <option *ngFor="let d of departments()">{{ d }}</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="alert alert-danger" style="margin:12px" *ngIf="error()">{{ error() }}</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Department</th><th>Position</th><th>Contact</th><th>Status</th><th *ngIf="canEdit()">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of filtered()">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar">{{ initials(e.name) }}</div>
                    <div>
                      <div class="fw-600" style="font-size:13.5px">{{ e.name }}</div>
                      <div class="text-sm text-muted">ID: {{ e.employeeId }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ e.department }}</td>
                <td>{{ e.position ?? '—' }}</td>
                <td class="text-sm text-muted">{{ e.email ?? e.contactInfo | slice:0:30 }}</td>
                <td><span [class]="statusBadge(e.status)">{{ e.status }}</span></td>
                <td *ngIf="canEdit()">
                  <button class="btn btn-ghost btn-sm" (click)="openForm(e)">Edit</button>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="6">
                  <div class="empty-state"><p>No employees found</p><small>Try adjusting your search filters</small></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-backdrop" *ngIf="showForm()" (click)="closeForm()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editing()?.employeeId ? 'Edit Employee' : 'Add Employee' }}</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input class="form-control" [(ngModel)]="form.name" placeholder="John Smith" />
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" class="form-control" [(ngModel)]="form.dob" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select class="form-control" [(ngModel)]="form.gender">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Department *</label>
              <input class="form-control" [(ngModel)]="form.department" placeholder="Manufacturing" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Position</label>
              <input class="form-control" [(ngModel)]="form.position" placeholder="Line Operator" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="employee@company.com" />
            </div>
          </div>
          <div class="form-row" *ngIf="!editing()?.employeeId">
            <div class="form-group">
              <label class="form-label">Temporary Password *</label>
              <input type="password" class="form-control" [(ngModel)]="createPassword" placeholder="Enter temporary password" />
            </div>
            <div class="form-group">
              <label class="form-label">Login Status</label>
              <select class="form-control" [(ngModel)]="form.status">
                <option>Pending</option><option>Active</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-control" [(ngModel)]="form.address" placeholder="123 Main St, City" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-control" [(ngModel)]="form.contactInfo" placeholder="555-0100" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="form.status">
                <option>Active</option><option>Inactive</option><option>Pending</option><option>Terminated</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeForm()">Cancel</button>
          <button class="btn btn-primary" (click)="save()">Save Employee</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.avatar { width:34px;height:34px;border-radius:50%;background:var(--primary-lighter);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0; } .fw-600{font-weight:600;}`],
})
export class EmployeeListComponent {
  private data = inject(MockDataService);
  private auth = inject(AuthService);
  error = this.data.operationError;

  search = '';
  filterStatus = '';
  filterDept = '';
  showForm = signal(false);
  editing = signal<Employee | null>(null);
  form: Partial<Employee> = {};
  createPassword = '';

  canEdit = computed(() => this.auth.hasRole('Manager', 'Administrator'));

  departments = computed(() => [...new Set(this.data.employees().map(e => e.department))]);

  filtered = computed(() => {
    let list = this.data.employees();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(e => e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || (e.position ?? '').toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(e => e.status === this.filterStatus);
    if (this.filterDept) list = list.filter(e => e.department === this.filterDept);
    return list;
  });

  openForm(e?: Employee): void {
    this.editing.set(e ?? null);
    this.form = e ? { ...e } : { status: 'Pending', gender: 'Male' };
    this.createPassword = '';
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.createPassword = '';
  }

  save(): void {
    if (!this.form.name || !this.form.department) return;
    if (this.editing()?.employeeId) {
      this.data.updateEmployee({ ...this.editing()!, ...this.form } as Employee);
    } else {
      if (!this.form.email || !this.form.contactInfo || !this.createPassword) return;
      this.data.addEmployee({ ...this.form, employeeId: '' } as Employee, this.createPassword);
    }
    this.closeForm();
  }

  initials(name: string): string { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
  statusBadge(s: string): string {
    const map: Record<string, string> = { Active: 'badge badge-success', Inactive: 'badge badge-danger', Pending: 'badge badge-warning', Terminated: 'badge badge-neutral' };
    return map[s] ?? 'badge badge-neutral';
  }
}

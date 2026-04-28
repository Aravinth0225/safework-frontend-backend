import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService, EmployeeResponseDTO, EmployeeRequest } from '../../core/services/employee.service';
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
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="alert alert-danger" style="margin:12px" *ngIf="error()">{{ error() }}</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Department</th><th>Contact</th><th>Status</th><th *ngIf="canEdit()">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of filtered()">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar">{{ initials(e.employeeName) }}</div>
                    <div>
                      <div class="fw-600" style="font-size:13.5px">{{ e.employeeName }}</div>
                      <div class="text-sm text-muted">ID: {{ e.employeeId }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ e.employeeDepartmentName }}</td>
                <td class="text-sm text-muted">{{ e.email | slice:0:30 }}</td>
                <td><span [class]="statusBadge(e.employeeStatus)">{{ e.employeeStatus }}</span></td>
                <td *ngIf="canEdit()">
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" (click)="openForm(e)">Edit</button>
                    <button class="btn btn-outline btn-sm" *ngIf="e.employeeStatus === 'Pending'" (click)="approveEmployee(e.employeeId)">Approve</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="5">
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
          <h3>{{ editingId ? 'Edit Employee' : 'Add Employee' }}</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input class="form-control" [(ngModel)]="form.userName" placeholder="John Smith" />
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" class="form-control" [(ngModel)]="form.employeeDOB" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select class="form-control" [(ngModel)]="form.employeeGender">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Department *</label>
              <input class="form-control" [(ngModel)]="form.employeeDepartmentName" placeholder="Manufacturing" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="form.userEmail" placeholder="employee@company.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-control" [(ngModel)]="form.userContact" placeholder="555-0100" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ editingId ? 'New Password (optional)' : 'Temporary Password *' }}</label>
              <input type="password" class="form-control" [(ngModel)]="form.password" placeholder="Enter secure password" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="form.userStatus">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-control" [(ngModel)]="form.employeeAddress" placeholder="123 Main St, City" />
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
export class EmployeeListComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private auth = inject(AuthService);
  error = signal<string | null>(null);

  search = '';
  filterStatus = '';
  showForm = signal(false);
  editingId: number | null = null;
  form: Partial<EmployeeRequest> = {};

  employees = signal<EmployeeResponseDTO[]>([]);

  canEdit = computed(() => this.auth.hasRole('Manager', 'Administrator'));

  filtered = computed(() => {
    let list = this.employees();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(e => e.employeeName?.toLowerCase().includes(q) || e.employeeDepartmentName?.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(e => e.employeeStatus?.toLowerCase() === this.filterStatus.toLowerCase());
    return list;
  });

  ngOnInit() {
    this.loadEmployees();
  }

  async loadEmployees() {
    try {
      const data = await this.employeeService.getAllEmployees();
      this.employees.set(data || []);
      this.error.set(null);
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to load employees.');
    }
  }

  openForm(e?: EmployeeResponseDTO): void {
    this.editingId = e?.employeeId ?? null;
    this.form = e ? {
      userName: e.employeeName,
      userEmail: e.email,
      employeeDepartmentName: e.employeeDepartmentName,
      userStatus: e.employeeStatus,
      userRole: 'EMPLOYEE',
      employeeGender: 'Male'
    } : { userStatus: 'Pending', userRole: 'EMPLOYEE', employeeGender: 'Male' };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId = null;
  }

  async save() {
    if (!this.form.userName || !this.form.employeeDepartmentName || !this.form.userEmail) {
      this.error.set('Name, Email and Department are required.');
      return;
    }
    
    try {
      const dto = this.form as EmployeeRequest;
      if (this.editingId) {
        await this.employeeService.updateEmployee(this.editingId, dto);
      } else {
        if (!this.form.password) {
          this.error.set('Password is required for new employees.');
          return;
        }
        await this.employeeService.registerEmployee(dto);
      }
      this.closeForm();
      this.loadEmployees();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to save employee.');
    }
  }

  async approveEmployee(employeeId: number) {
    try {
      await this.employeeService.approveEmployee(employeeId);
      this.loadEmployees();
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Failed to approve employee.');
    }
  }

  initials(name: string): string { return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
  
  statusBadge(s: string): string {
    const stat = (s || '').toLowerCase();
    if (stat === 'active') return 'badge badge-success';
    if (stat === 'inactive') return 'badge badge-danger';
    if (stat === 'pending') return 'badge badge-warning';
    return 'badge badge-neutral';
  }
}

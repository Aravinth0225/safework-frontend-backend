import { Component, computed, signal, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { User, UserRole } from '../../core/models';

const ROLES: UserRole[] = ['Employee', 'Safety Officer', 'Hazard Officer', 'Manager', 'Administrator', 'Compliance Officer', 'Government Auditor'];

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">User Management</div>
          <div class="page-subtitle">Manage system users and role assignments</div>
        </div>
        <button class="btn btn-primary" (click)="openForm()">+ Add User</button>
      </div>

      <!-- Role breakdown -->
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card" *ngFor="let r of roleStats()">
          <div class="stat-icon" style="background:var(--primary-lighter)">👤</div>
          <div class="stat-value">{{ r.count }}</div>
          <div class="stat-label" style="font-size:11px">{{ r.role }}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search by name or email..." />
            </div>
            <select class="form-control" style="width:200px" [(ngModel)]="filterRole">
              <option value="">All Roles</option>
              <option *ngFor="let r of roles">{{ r }}</option>
            </select>
            <select class="form-control" style="width:140px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} users</span>
        </div>
        <div class="alert alert-danger" *ngIf="operationError()" style="margin: 0 16px 16px;">{{ operationError() }}</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>User</th><th>Role</th><th>Department</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filtered()">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar">{{ initials(u.name) }}</div>
                    <div>
                      <div class="fw-600" style="font-size:13.5px">{{ u.name }}</div>
                      <div class="text-sm text-muted">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td><span [class]="roleBadge(u.role)">{{ u.role }}</span></td>
                <td class="text-sm text-muted">{{ u.department ?? '—' }}</td>
                <td class="text-sm text-muted">{{ u.phone }}</td>
                <td><span [class]="u.status === 'Active' ? 'badge badge-success' : 'badge badge-danger'">{{ u.status }}</span></td>
                <td><button class="btn btn-ghost btn-sm" (click)="openForm(u)">Edit</button></td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="6"><div class="empty-state"><p>No users found</p></div></td>
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
          <h3>{{ editing()?.userId ? 'Edit User' : 'Add User' }}</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input class="form-control" [(ngModel)]="form.name" placeholder="Jane Smith" />
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-control" [(ngModel)]="form.email" placeholder="jane@safework.com" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Role *</label>
              <select class="form-control" [(ngModel)]="form.role">
                <option *ngFor="let r of roles">{{ r }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Department</label>
              <input class="form-control" [(ngModel)]="form.department" placeholder="Manufacturing" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-control" [(ngModel)]="form.phone" placeholder="555-0100" />
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="form.status">
                <option>Active</option><option>Inactive</option><option>Pending</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ editing()?.userId ? 'New Password (optional)' : 'Password *' }}</label>
              <input type="password" class="form-control" [(ngModel)]="form.password" placeholder="Enter secure password" />
            </div>
            <div class="form-group">
              <label class="form-label">User ID</label>
              <input class="form-control" [value]="editing()?.userId ?? 'Auto-generated'" readonly />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeForm()">Cancel</button>
          <button class="btn btn-primary" (click)="save()">Save User</button>
        </div>
      </div>
    </div>
  `,
  styles: [`.avatar{width:34px;height:34px;border-radius:50%;background:var(--primary-lighter);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}.fw-600{font-weight:600}`],
})
export class UserListComponent {
  private data = inject(MockDataService);

  search = '';
  filterRole = '';
  filterStatus = '';
  roles = ROLES;
  showForm = signal(false);
  editing = signal<User | null>(null);
  operationError = this.data.operationError;
  form: Partial<User> = {};

  filtered = computed(() => {
    let list = this.data.users();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    if (this.filterRole) list = list.filter(u => u.role === this.filterRole);
    if (this.filterStatus) list = list.filter(u => u.status === this.filterStatus);
    return list;
  });

  roleStats = computed(() => ROLES.map(r => ({ role: r, count: this.data.users().filter(u => u.role === r).length })));

  openForm(u?: User): void {
    this.editing.set(u ?? null);
    this.form = u ? { ...u, password: '' } : { role: 'Employee', status: 'Active', password: '' };
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  save(): void {
    if (!this.form.name || !this.form.email) return;
    if (!this.editing()?.userId && !this.form.password) {
      this.operationError.set('Password is required for new users.');
      return;
    }
    if (this.editing()?.userId) {
      this.data.updateUser({ ...this.editing()!, ...this.form } as User);
    } else {
      this.data.addUser({ ...this.form, userId: '' } as User);
    }
    this.closeForm();
  }

  initials(name: string): string { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

  roleBadge(r: string): string {
    const map: Record<string, string> = {
      Employee: 'badge badge-neutral',
      'Safety Officer': 'badge badge-info',
      'Hazard Officer': 'badge badge-warning',
      Manager: 'badge badge-primary',
      Administrator: 'badge badge-warning',
      'Compliance Officer': 'badge badge-success',
      'Government Auditor': 'badge badge-danger',
    };
    return map[r] ?? 'badge badge-neutral';
  }
}

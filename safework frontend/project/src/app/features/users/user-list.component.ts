import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserPublicDTO, UserRegistrationDTO, UserUpdateDTO } from '../../core/services/user.service';

const ROLES = ['EMPLOYEE', 'SAFETY_OFFICER', 'HAZARD_OFFICER', 'ADMIN', 'COMPLIANCE_OFFICER'];

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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} users</span>
        </div>
        <div class="alert alert-danger" *ngIf="operationError()" style="margin: 0 16px 16px;">{{ operationError() }}</div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>User</th><th>Role</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filtered()">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar">{{ initials(u.userName) }}</div>
                    <div>
                      <div class="fw-600" style="font-size:13.5px">{{ u.userName }}</div>
                      <div class="text-sm text-muted">{{ u.userEmail }}</div>
                    </div>
                  </div>
                </td>
                <td><span [class]="roleBadge(u.userRole)">{{ u.userRole }}</span></td>
                <td class="text-sm text-muted">{{ u.userContact }}</td>
                <td><span [class]="u.userStatus === 'ACTIVE' ? 'badge badge-success' : 'badge badge-danger'">{{ u.userStatus }}</span></td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-ghost btn-sm" (click)="openForm(u)">Edit</button>
                    <button class="btn btn-ghost btn-sm text-danger" (click)="deleteUser(u.userId)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="5"><div class="empty-state"><p>No users found</p></div></td>
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
              <input class="form-control" [(ngModel)]="form.userName" placeholder="Jane Smith" />
            </div>
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" class="form-control" [(ngModel)]="form.userEmail" placeholder="jane@safework.com" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Role *</label>
              <select class="form-control" [(ngModel)]="form.userRole">
                <option *ngFor="let r of roles">{{ r }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Contact</label>
              <input class="form-control" [(ngModel)]="form.userContact" placeholder="555-0100" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="form.userStatus">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">{{ editing()?.userId ? 'New Password (optional)' : 'Password *' }}</label>
              <input type="password" class="form-control" [(ngModel)]="form.password" placeholder="Enter secure password" />
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
  styles: [`.avatar{width:34px;height:34px;border-radius:50%;background:var(--primary-lighter);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}.fw-600{font-weight:600}.text-danger{color: var(--danger)}`],
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);

  search = '';
  filterRole = '';
  filterStatus = '';
  roles = ROLES;
  showForm = signal(false);
  editing = signal<UserPublicDTO | null>(null);
  operationError = signal<string | null>(null);
  form: any = {};

  users = signal<UserPublicDTO[]>([]);

  filtered = computed(() => {
    let list = this.users();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(u => u.userName?.toLowerCase().includes(q) || u.userEmail?.toLowerCase().includes(q));
    if (this.filterRole) list = list.filter(u => u.userRole === this.filterRole);
    if (this.filterStatus) list = list.filter(u => u.userStatus === this.filterStatus);
    return list;
  });

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const data = await this.userService.getAllUsers();
      this.users.set(data || []);
      this.operationError.set(null);
    } catch (error: any) {
      this.operationError.set(error?.error?.message || 'Failed to load users');
    }
  }

  openForm(u?: UserPublicDTO): void {
    this.editing.set(u ?? null);
    this.form = u ? { ...u, password: '' } : { userRole: 'EMPLOYEE', userStatus: 'ACTIVE', password: '' };
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  async save() {
    if (!this.form.userName || !this.form.userEmail) {
      this.operationError.set('Name and Email are required.');
      return;
    }
    
    try {
      if (this.editing()?.userId) {
        const dto: UserUpdateDTO = {
          userName: this.form.userName,
          userEmail: this.form.userEmail,
          userContact: this.form.userContact,
          userRole: this.form.userRole,
          userStatus: this.form.userStatus
        };
        if (this.form.password) dto.password = this.form.password;
        
        await this.userService.updateUser(this.editing()!.userId, dto);
      } else {
        if (!this.form.password) {
          this.operationError.set('Password is required for new users.');
          return;
        }
        const dto: UserRegistrationDTO = {
          userName: this.form.userName,
          userEmail: this.form.userEmail,
          userContact: this.form.userContact,
          userRole: this.form.userRole,
          userStatus: this.form.userStatus,
          password: this.form.password
        };
        await this.userService.registerUser(dto);
      }
      this.closeForm();
      this.loadUsers();
    } catch (error: any) {
      this.operationError.set(error?.error?.message || 'Failed to save user.');
    }
  }

  async deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await this.userService.deleteUser(userId);
        this.loadUsers();
      } catch (error: any) {
        this.operationError.set(error?.error?.message || 'Failed to delete user.');
      }
    }
  }

  initials(name: string): string { return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

  roleBadge(r: string): string {
    const map: Record<string, string> = {
      EMPLOYEE: 'badge badge-neutral',
      SAFETY_OFFICER: 'badge badge-info',
      HAZARD_OFFICER: 'badge badge-warning',
      ADMIN: 'badge badge-primary',
      COMPLIANCE_OFFICER: 'badge badge-success'
    };
    return map[r] ?? 'badge badge-neutral';
  }
}

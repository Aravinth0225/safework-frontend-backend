import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Training } from '../../core/models';

@Component({
  selector: 'app-training-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Training Records</div>
          <div class="page-subtitle">Employee training enrollment and completion status</div>
        </div>
      </div>

      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card">
          <div class="stat-icon" style="background:#d1fae5">🎓</div>
          <div class="stat-value">{{ completed() }}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe">⏳</div>
          <div class="stat-value">{{ inProgress() }}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7">📋</div>
          <div class="stat-value">{{ enrolled() }}</div>
          <div class="stat-label">Enrolled</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fee2e2">✗</div>
          <div class="stat-value">{{ failed() }}</div>
          <div class="stat-label">Failed</div>
        </div>
      </div>

      <div class="card" *ngIf="canAssignTraining()">
        <div class="card-header">
          <div>
            <div class="card-title">Assign Training</div>
            <div class="text-sm text-muted">Create training using available programs and employees</div>
          </div>
        </div>
        <div class="form-grid" style="grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding: 16px;">
          <select class="form-control" [(ngModel)]="form.programId">
            <option value="">Select Program</option>
            <option *ngFor="let p of assignablePrograms()" [value]="p.programId">{{ p.title }}</option>
          </select>
          <select class="form-control" [(ngModel)]="form.employeeId">
            <option value="">Select Employee</option>
            <option *ngFor="let e of assignableEmployees()" [value]="e.employeeId">{{ e.name }}</option>
          </select>
          <select class="form-control" [(ngModel)]="form.status">
            <option>Enrolled</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Failed</option>
          </select>
          <input class="form-control" type="date" [(ngModel)]="form.completionDate" />
        </div>
        <div style="padding: 0 16px 16px;">
          <button class="btn btn-primary" (click)="assignTraining()">{{ editingTrainingId ? 'Update Training' : 'Assign Training' }}</button>
        </div>
      </div>

      <div class="alert alert-danger" *ngIf="operationError()">{{ operationError() }}</div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search trainings..." />
            </div>
            <select class="form-control" style="width:150px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Enrolled</option><option>In Progress</option><option>Completed</option><option>Failed</option>
            </select>
            <select class="form-control" style="width:180px" [(ngModel)]="filterProgram">
              <option value="">All Programs</option>
              <option *ngFor="let p of assignablePrograms()" [value]="p.programId">{{ p.title }}</option>
            </select>
            <select class="form-control" style="width:180px" [(ngModel)]="filterEmployee">
              <option value="">All Employees</option>
              <option *ngFor="let e of assignableEmployees()" [value]="e.employeeId">{{ e.name }}</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} records</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Employee</th><th>Program</th><th>Completion Date</th><th>Status</th><th *ngIf="canAssignTraining()">Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of filtered()">
                <td class="fw-500">{{ t.employeeName }}</td>
                <td>{{ t.programTitle }}</td>
                <td class="text-sm text-muted">{{ t.completionDate ? (t.completionDate | date:'MMM d, y') : '—' }}</td>
                <td><span [class]="statusBadge(t.status)">{{ t.status }}</span></td>
                <td *ngIf="canAssignTraining()" style="display:flex;gap:8px">
                  <button class="btn btn-ghost btn-sm" (click)="editTraining(t)">Edit</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteTraining(t.trainingId)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td [attr.colspan]="canAssignTraining() ? 5 : 4"><div class="empty-state"><p>No training records found</p></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`.fw-500{font-weight:500}`],
})
export class TrainingListComponent {
  private data = inject(MockDataService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  filterProgram = '';
  filterEmployee = '';
  operationError = this.data.operationError;
  editingTrainingId = '';
  form: { programId: string; employeeId: string; status: Training['status']; completionDate: string } = {
    programId: '',
    employeeId: '',
    status: 'Enrolled',
    completionDate: '',
  };

  filtered = computed(() => {
    let list = this.data.trainings();
    if (this.auth.hasRole('Employee')) {
      const uid = this.auth.currentUser()?.userId ?? '';
      const empId = this.data.employees().find(e => e.userId === uid)?.employeeId ?? '';
      list = list.filter(t => t.employeeId === empId);
    }
    const q = this.search.toLowerCase();
    if (q) list = list.filter(t => t.employeeName.toLowerCase().includes(q) || t.programTitle.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(t => t.status === this.filterStatus);
    if (this.filterProgram) list = list.filter(t => t.programId === this.filterProgram);
    if (this.filterEmployee) list = list.filter(t => t.employeeId === this.filterEmployee);
    return list;
  });

  completed = computed(() => this.data.trainings().filter(t => t.status === 'Completed').length);
  inProgress = computed(() => this.data.trainings().filter(t => t.status === 'In Progress').length);
  enrolled = computed(() => this.data.trainings().filter(t => t.status === 'Enrolled').length);
  failed = computed(() => this.data.trainings().filter(t => t.status === 'Failed').length);
  assignablePrograms = computed(() => this.data.programs().filter(p => p.status !== 'Cancelled'));
  assignableEmployees = computed(() => this.data.employees().filter(e => e.status !== 'Terminated'));

  statusBadge(s: string): string {
    const map: Record<string, string> = { Completed: 'badge badge-success', 'In Progress': 'badge badge-info', Enrolled: 'badge badge-primary', Failed: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }

  canAssignTraining(): boolean {
    return this.auth.hasRole('Administrator');
  }

  assignTraining(): void {
    if (!this.form.programId || !this.form.employeeId) {
      this.operationError.set('Please select both program and employee.');
      return;
    }

    const payload: Training = {
      trainingId: '',
      programId: this.form.programId,
      programTitle: '',
      employeeId: this.form.employeeId,
      employeeName: '',
      completionDate: this.form.completionDate || undefined,
      status: this.form.status,
    };
    if (this.editingTrainingId) {
      payload.trainingId = this.editingTrainingId;
      this.data.updateTraining(payload);
    } else {
      this.data.addTraining(payload);
    }

    this.form = {
      programId: '',
      employeeId: '',
      status: 'Enrolled',
      completionDate: '',
    };
    this.editingTrainingId = '';
  }

  editTraining(t: Training): void {
    this.editingTrainingId = t.trainingId;
    this.form = {
      programId: t.programId,
      employeeId: t.employeeId,
      status: t.status,
      completionDate: t.completionDate ?? '',
    };
  }

  deleteTraining(trainingId: string): void {
    this.data.deleteTraining(trainingId);
    if (this.editingTrainingId === trainingId) {
      this.editingTrainingId = '';
      this.form = {
        programId: '',
        employeeId: '',
        status: 'Enrolled',
        completionDate: '',
      };
    }
  }
}

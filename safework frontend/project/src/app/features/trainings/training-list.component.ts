import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainingService, Training } from '../../core/services/training.service';
import { ProgramService, Program } from '../../core/services/program.service';
import { EmployeeService, EmployeeResponseDTO } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';

interface TrainingView extends Training {
  employeeName: string;
  programTitle: string;
}

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
            <option [value]="0">Select Program</option>
            <option *ngFor="let p of assignablePrograms()" [value]="p.programId">{{ p.programTitle }}</option>
          </select>
          <select class="form-control" [(ngModel)]="form.employeeId">
            <option [value]="0">Select Employee</option>
            <option *ngFor="let e of assignableEmployees()" [value]="e.employeeId">{{ e.employeeName }}</option>
          </select>
          <select class="form-control" [(ngModel)]="form.trainingStatus">
            <option value="ENROLLED">Enrolled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
          <input class="form-control" type="date" [(ngModel)]="form.trainingCompletionDate" />
        </div>
        <div style="padding: 0 16px 16px;">
          <button class="btn btn-primary" (click)="assignTraining()">{{ editingTrainingId ? 'Update Training' : 'Assign Training' }}</button>
        </div>
      </div>

      <div class="alert alert-danger" *ngIf="operationError()" style="margin: 0 16px 16px;">{{ operationError() }}</div>

      <div class="card">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search trainings..." />
            </div>
            <select class="form-control" style="width:150px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
            <select class="form-control" style="width:180px" [(ngModel)]="filterProgram">
              <option value="">All Programs</option>
              <option *ngFor="let p of assignablePrograms()" [value]="p.programId">{{ p.programTitle }}</option>
            </select>
            <select class="form-control" style="width:180px" [(ngModel)]="filterEmployee">
              <option value="">All Employees</option>
              <option *ngFor="let e of assignableEmployees()" [value]="e.employeeId">{{ e.employeeName }}</option>
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
                <td class="text-sm text-muted">{{ t.trainingCompletionDate ? (t.trainingCompletionDate | date:'MMM d, y') : '—' }}</td>
                <td><span [class]="statusBadge(t.trainingStatus)">{{ getStatusLabel(t.trainingStatus) }}</span></td>
                <td *ngIf="canAssignTraining()" style="display:flex;gap:8px">
                  <button class="btn btn-ghost btn-sm" (click)="editTraining(t)">Edit</button>
                  <button class="btn btn-ghost btn-sm text-danger" (click)="deleteTraining(t.id!)">Delete</button>
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
  styles: [`.fw-500{font-weight:500} .text-danger{color: var(--danger)}`],
})
export class TrainingListComponent implements OnInit {
  private trainingService = inject(TrainingService);
  private programService = inject(ProgramService);
  private employeeService = inject(EmployeeService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  filterProgram = '';
  filterEmployee = '';
  operationError = signal<string | null>(null);
  editingTrainingId: number | null = null;
  form: Partial<Training> = {
    programId: 0,
    employeeId: 0,
    trainingStatus: 'ENROLLED',
    trainingCompletionDate: '',
  };

  trainings = signal<Training[]>([]);
  programs = signal<Program[]>([]);
  employees = signal<EmployeeResponseDTO[]>([]);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      // Fetch programs and employees gracefully, as employees might not have permission to fetch ALL employees/programs
      const [programsResult, employeesResult] = await Promise.allSettled([
        this.programService.getAllPrograms(),
        this.employeeService.getAllEmployees()
      ]);
      
      this.programs.set(programsResult.status === 'fulfilled' ? programsResult.value || [] : []);
      this.employees.set(employeesResult.status === 'fulfilled' ? employeesResult.value || [] : []);
      
      await this.loadTrainings();
    } catch (error: any) {
      this.operationError.set(error?.error?.message || 'Failed to load initial data');
    }
  }

  async loadTrainings() {
    try {
      let data: Training[];
      if (this.auth.hasRole('Employee')) {
        const uid = Number(this.auth.currentUser()?.userId ?? 0);
        data = await this.trainingService.getTrainingsByEmployee(uid);
      } else {
        data = await this.trainingService.getAllTrainings();
      }
      this.trainings.set(data || []);
      this.operationError.set(null);
    } catch (error: any) {
      this.operationError.set(error?.error?.message || 'Failed to load trainings');
    }
  }

  // Mapped list containing employee names and program titles
  mappedTrainings = computed<TrainingView[]>(() => {
    return this.trainings().map(t => {
      const emp = this.employees().find(e => Number(e.employeeId) === Number(t.employeeId));
      const prog = this.programs().find(p => Number(p.programId) === Number(t.programId));
      return {
        ...t,
        employeeName: emp ? emp.employeeName : `Emp #${t.employeeId}`,
        programTitle: prog ? prog.programTitle : `Prog #${t.programId}`
      };
    });
  });

  filtered = computed(() => {
    let list = this.mappedTrainings();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(t => t.employeeName.toLowerCase().includes(q) || t.programTitle.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(t => t.trainingStatus === this.filterStatus);
    if (this.filterProgram) list = list.filter(t => t.programId === Number(this.filterProgram));
    if (this.filterEmployee) list = list.filter(t => t.employeeId === Number(this.filterEmployee));
    return list;
  });

  completed = computed(() => this.trainings().filter(t => t.trainingStatus === 'COMPLETED').length);
  inProgress = computed(() => this.trainings().filter(t => t.trainingStatus === 'IN_PROGRESS').length);
  enrolled = computed(() => this.trainings().filter(t => t.trainingStatus === 'ENROLLED').length);
  failed = computed(() => this.trainings().filter(t => t.trainingStatus === 'FAILED').length);
  
  assignablePrograms = computed(() => this.programs().filter(p => p.programStatus !== 'CANCELLED'));
  assignableEmployees = computed(() => this.employees().filter(e => e.employeeStatus?.toUpperCase() !== 'TERMINATED'));

  getStatusLabel(s: string): string {
    const map: Record<string, string> = { COMPLETED: 'Completed', IN_PROGRESS: 'In Progress', ENROLLED: 'Enrolled', FAILED: 'Failed' };
    return map[s] ?? s;
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = { COMPLETED: 'badge badge-success', IN_PROGRESS: 'badge badge-info', ENROLLED: 'badge badge-primary', FAILED: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }

  canAssignTraining(): boolean {
    return this.auth.hasRole('Administrator', 'Safety Officer', 'Manager');
  }

  async assignTraining() {
    if (!this.form.programId || !this.form.employeeId || Number(this.form.programId) === 0 || Number(this.form.employeeId) === 0) {
      this.operationError.set('Please select both program and employee.');
      return;
    }

    const payload: Training = {
      programId: Number(this.form.programId),
      employeeId: Number(this.form.employeeId),
      trainingCompletionDate: this.form.trainingCompletionDate || undefined,
      trainingStatus: this.form.trainingStatus || 'ENROLLED',
    };

    try {
      if (this.editingTrainingId) {
        payload.id = this.editingTrainingId;
        await this.trainingService.updateTraining(this.editingTrainingId, payload);
      } else {
        await this.trainingService.createTraining(payload);
      }
      
      this.form = {
        programId: 0,
        employeeId: 0,
        trainingStatus: 'ENROLLED',
        trainingCompletionDate: '',
      };
      this.editingTrainingId = null;
      this.loadTrainings();
    } catch (error: any) {
      this.operationError.set(error?.error?.message || 'Failed to save training.');
    }
  }

  editTraining(t: TrainingView): void {
    this.editingTrainingId = t.id!;
    this.form = {
      programId: t.programId,
      employeeId: t.employeeId,
      trainingStatus: t.trainingStatus,
      trainingCompletionDate: t.trainingCompletionDate ?? '',
    };
  }

  async deleteTraining(trainingId: number) {
    if (confirm('Are you sure you want to delete this training record?')) {
      try {
        await this.trainingService.deleteTraining(trainingId);
        if (this.editingTrainingId === trainingId) {
          this.editingTrainingId = null;
          this.form = {
            programId: 0,
            employeeId: 0,
            trainingStatus: 'ENROLLED',
            trainingCompletionDate: '',
          };
        }
        this.loadTrainings();
      } catch (error: any) {
        this.operationError.set(error?.error?.message || 'Failed to delete training.');
      }
    }
  }
}

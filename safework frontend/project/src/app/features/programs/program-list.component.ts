import { Component, computed, signal, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Program } from '../../core/models';

@Component({
  selector: 'app-program-list',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, SlicePipe, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Safety Programs</div>
          <div class="page-subtitle">Manage workplace safety training programs</div>
        </div>
        <button class="btn btn-primary" *ngIf="canAdd()" (click)="openForm()">+ Add Program</button>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <div class="search-bar" style="margin:0;flex:1">
            <div class="search-input-wrap">
              <span class="search-icon">🔍</span>
              <input class="form-control" [(ngModel)]="search" placeholder="Search programs..." />
            </div>
            <select class="form-control" style="width:160px" [(ngModel)]="filterStatus">
              <option value="">All Status</option>
              <option>Planned</option>
              <option>Active</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          <span class="text-muted text-sm">{{ filtered().length }} programs</span>
        </div>
      </div>

      <div class="alert alert-danger" *ngIf="operationError()">{{ operationError() }}</div>

      <div class="programs-grid">
        <div *ngFor="let p of filtered()" class="program-card card">
          <div class="program-header">
            <div>
              <div class="program-title">{{ p.title }}</div>
              <div class="program-dates text-sm text-muted">{{ p.startDate | date:'MMM d' }} — {{ p.endDate | date:'MMM d, y' }}</div>
            </div>
            <span [class]="statusBadge(p.status)">{{ p.status }}</span>
          </div>
          <p class="program-desc text-muted">{{ p.description | slice:0:120 }}{{ p.description.length > 120 ? '...' : '' }}</p>
          <div class="program-progress" *ngIf="p.enrolledCount">
            <div class="progress-info">
              <span class="text-sm">{{ p.completedCount }} / {{ p.enrolledCount }} completed</span>
              <span class="text-sm fw-600">{{ progressPct(p) }}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" [style.width.%]="progressPct(p)"></div>
            </div>
          </div>
          <div class="program-footer">
            <div class="text-sm text-muted">{{ p.enrolledCount ?? 0 }} enrolled</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost btn-sm" (click)="selected.set(p)">Details</button>
              <button class="btn btn-ghost btn-sm" *ngIf="canAdd()" (click)="editProgram(p)">Edit</button>
              <button class="btn btn-danger btn-sm" *ngIf="canAdd()" (click)="deleteProgram(p)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="filtered().length === 0" class="empty-state card" style="padding:48px">
        <p>No programs found</p>
      </div>
    </div>

    <!-- Add Modal -->
    <div class="modal-backdrop" *ngIf="showForm()" (click)="closeForm()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editing() ? 'Edit Safety Program' : 'Add Safety Program' }}</h3>
          <button class="btn btn-ghost btn-sm" (click)="closeForm()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Program Title *</label>
            <input class="form-control" [(ngModel)]="form.title" placeholder="e.g. Fire Safety & Evacuation Training" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" [(ngModel)]="form.description" rows="3" placeholder="Describe the program objectives..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.startDate" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.endDate" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" [(ngModel)]="form.status">
              <option>Planned</option><option>Active</option><option>Completed</option><option>Cancelled</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" (click)="closeForm()">Cancel</button>
          <button class="btn btn-primary" (click)="save()">{{ editing() ? 'Update Program' : 'Save Program' }}</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal-backdrop" *ngIf="selected()" (click)="selected.set(null)">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ selected()?.title }}</h3>
          <button class="btn btn-ghost btn-sm" (click)="selected.set(null)">✕</button>
        </div>
        <div class="modal-body" *ngIf="selected() as p">
          <p style="color:var(--text-muted);font-size:14px;line-height:1.6">{{ p.description }}</p>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Start Date</span><span>{{ p.startDate | date:'MMMM d, y' }}</span></div>
            <div class="detail-item"><span class="detail-label">End Date</span><span>{{ p.endDate | date:'MMMM d, y' }}</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span [class]="statusBadge(p.status)">{{ p.status }}</span></div>
            <div class="detail-item"><span class="detail-label">Enrolled</span><span>{{ p.enrolledCount ?? 0 }}</span></div>
            <div class="detail-item"><span class="detail-label">Completed</span><span>{{ p.completedCount ?? 0 }}</span></div>
            <div class="detail-item"><span class="detail-label">Completion Rate</span><span class="fw-600">{{ progressPct(p) }}%</span></div>
          </div>
          <div class="progress-bar-bg" style="margin-top:4px">
            <div class="progress-bar-fill" [style.width.%]="progressPct(p)"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" *ngIf="selected() && canAdd()" (click)="editProgram(selected()!)">Edit</button>
          <button class="btn btn-danger" *ngIf="selected() && canAdd()" (click)="deleteProgram(selected()!)">Delete</button>
          <button class="btn btn-outline" (click)="selected.set(null)">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .programs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .program-card { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .program-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .program-title { font-size: 15px; font-weight: 600; line-height: 1.3; }
    .program-dates { margin-top: 2px; }
    .program-desc { font-size: 13px; line-height: 1.5; }
    .program-progress { display: flex; flex-direction: column; gap: 4px; }
    .progress-info { display: flex; justify-content: space-between; }
    .progress-bar-bg { height: 6px; background: var(--border); border-radius: 4px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: var(--secondary); border-radius: 4px; transition: width .3s; }
    .program-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 4px; border-top: 1px solid var(--border); }
    .fw-600 { font-weight: 600; }
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px}
    .detail-item{display:flex;flex-direction:column;gap:3px}
    .detail-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted)}
  `],
})
export class ProgramListComponent {
  private data = inject(MockDataService);
  private auth = inject(AuthService);

  search = '';
  filterStatus = '';
  showForm = signal(false);
  selected = signal<Program | null>(null);
  editing = signal<Program | null>(null);
  operationError = this.data.operationError;
  form: Partial<Program> = {};

  canAdd = computed(() => this.auth.hasRole('Manager', 'Administrator'));

  filtered = computed(() => {
    let list = this.data.programs();
    const q = this.search.toLowerCase();
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    if (this.filterStatus) list = list.filter(p => p.status === this.filterStatus);
    return list;
  });

  progressPct(p: Program): number {
    if (!p.enrolledCount) return 0;
    return Math.round(((p.completedCount ?? 0) / p.enrolledCount) * 100);
  }

  openForm(): void {
    this.editing.set(null);
    this.form = { status: 'Planned', enrolledCount: 0, completedCount: 0 };
    this.showForm.set(true);
  }

  editProgram(p: Program): void {
    this.editing.set(p);
    this.form = { ...p };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (!this.form.title || !this.form.startDate || !this.form.endDate) return;
    const payload = { ...this.form } as Program;
    if (this.editing()?.programId) {
      payload.programId = this.editing()!.programId;
      this.data.updateProgram(payload);
    } else {
      this.data.addProgram({ ...payload, programId: '' });
    }
    this.closeForm();
  }

  deleteProgram(p: Program): void {
    this.data.deleteProgram(p.programId);
    if (this.selected()?.programId === p.programId) this.selected.set(null);
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = { Active: 'badge badge-success', Planned: 'badge badge-primary', Completed: 'badge badge-neutral', Cancelled: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }
}

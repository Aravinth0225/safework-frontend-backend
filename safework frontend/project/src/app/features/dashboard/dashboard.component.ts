import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe, NgClass, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { HazardService, HazardReportProjection } from '../../core/services/hazard.service';
import { TrainingService, Training } from '../../core/services/training.service';
import { ProgramService, Program } from '../../core/services/program.service';
import { IncidentService, IncidentReportProjection } from '../../core/services/incident.service';
import { InspectionService, InspectionResponseDTO } from '../../core/services/inspection.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, NgClass, SlicePipe, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="page-title">Welcome back, {{ firstName() }}</div>
          <div class="page-subtitle">{{ user()?.role }} · {{ today | date:'EEEE, MMMM d, y' }}</div>
        </div>
      </div>

      <!-- Employee Dashboard -->
      <ng-container *ngIf="role() === 'Employee'">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:#fee2e2">⚠</div>
            <div class="stat-value">{{ myHazards().length }}</div>
            <div class="stat-label">My Hazard Reports</div>
            <div class="stat-delta">{{ openHazards() }} open</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe">🎓</div>
            <div class="stat-value">{{ myTrainings().length }}</div>
            <div class="stat-label">My Trainings</div>
            <div class="stat-delta">{{ completedTrainings() }} completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7">🔔</div>
            <div class="stat-value">{{ myUnread() }}</div>
            <div class="stat-label">Unread Alerts</div>
            <div class="stat-delta">notifications pending</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#d1fae5">✓</div>
            <div class="stat-value">{{ trainingRate() }}%</div>
            <div class="stat-label">Training Completion</div>
            <div class="stat-delta">your progress</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>My Recent Hazard Reports</h3><a routerLink="/hazards" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let h of empHazards().slice(0,4)" class="list-row">
                <div>
                  <div class="fw-500">{{ h.hazardDescription | slice:0:50 }}...</div>
                  <div class="text-sm text-muted">{{ h.hazardLocation }} · {{ h.hazardDate | date:'MMM d' }}</div>
                </div>
                <span [class]="statusBadge(h.hazardStatus)">{{ h.hazardStatus }}</span>
              </div>
              <div *ngIf="empHazards().length === 0" class="empty-state"><p>No hazard reports yet</p></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>My Training Status</h3><a routerLink="/trainings" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let t of empTrainingsView().slice(0,4)" class="list-row">
                <div>
                  <div class="fw-500">{{ t.programTitle }}</div>
                  <div class="text-sm text-muted">{{ t.trainingCompletionDate ? 'Completed: ' + (t.trainingCompletionDate | date:'MMM d') : 'In progress' }}</div>
                </div>
                <span [class]="trainingBadge(t.trainingStatus)">{{ getTrainingStatusLabel(t.trainingStatus) }}</span>
              </div>
              <div *ngIf="empTrainingsView().length === 0" class="empty-state"><p>No trainings enrolled</p></div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Safety Officer Dashboard -->
      <ng-container *ngIf="role() === 'Safety Officer' || role() === 'Hazard Officer'">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:#fee2e2">🔔</div>
            <div class="stat-value">{{ openIncidents() }}</div>
            <div class="stat-label">Open Incidents</div>
            <div class="stat-delta">requiring action</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7">⚠</div>
            <div class="stat-value">{{ criticalHazards() }}</div>
            <div class="stat-label">Critical Hazards</div>
            <div class="stat-delta">{{ highHazards() }} high severity</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe">🔍</div>
            <div class="stat-value">{{ scheduledInspections() }}</div>
            <div class="stat-label">Scheduled Inspections</div>
            <div class="stat-delta">upcoming</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#d1fae5">✓</div>
            <div class="stat-value">{{ completedInspections() }}</div>
            <div class="stat-label">Completed Inspections</div>
            <div class="stat-delta">this period</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>Recent Hazard Reports</h3><a routerLink="/hazards" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let h of soHazards().slice(0,5)" class="list-row">
                <div>
                  <div class="fw-500">{{ h.hazardDescription | slice:0:48 }}{{ (h.hazardDescription?.length ?? 0) > 48 ? '...' : '' }}</div>
                  <div class="text-sm text-muted">{{ h.hazardLocation }} · Emp #{{ h.employeeId }}</div>
                </div>
                <span [class]="statusBadge(h.hazardStatus)">{{ h.hazardStatus }}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Active Incidents</h3><a routerLink="/incidents" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let i of soIncidents().slice(0,5)" class="list-row">
                <div>
                  <div class="fw-500">{{ i.hazardDescription | slice:0:48 }}{{ (i.hazardDescription?.length ?? 0) > 48 ? '...' : '' }}</div>
                  <div class="text-sm text-muted">{{ i.date | date:'MMM d' }}</div>
                </div>
                <span [class]="incidentBadge(i.status)">{{ i.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Manager Dashboard -->
      <ng-container *ngIf="role() === 'Manager'">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe">📋</div>
            <div class="stat-value">{{ activePrograms() }}</div>
            <div class="stat-label">Active Programs</div>
            <div class="stat-delta">{{ plannedPrograms() }} planned</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#d1fae5">🎓</div>
            <div class="stat-value">{{ overallTrainingRate() }}%</div>
            <div class="stat-label">Training Completion</div>
            <div class="stat-delta">across all programs</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fee2e2">⚠</div>
            <div class="stat-value">{{ openHazardsTotal() }}</div>
            <div class="stat-label">Open Hazards</div>
            <div class="stat-delta">{{ criticalHazards() }} critical</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7">👤</div>
            <div class="stat-value">{{ totalEmployees() }}</div>
            <div class="stat-label">Total Employees</div>
            <div class="stat-delta">{{ activeEmployees() }} active</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>Safety Programs</h3><a routerLink="/programs" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let p of allPrograms().slice(0,4)" class="list-row">
                <div>
                  <div class="fw-500">{{ p.title }}</div>
                  <div class="text-sm text-muted">{{ p.enrolledCount }} enrolled · {{ p.completedCount }} completed</div>
                </div>
                <span [class]="programBadge(p.status)">{{ p.status }}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Recent Reports</h3><a routerLink="/reports" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let r of allReports().slice(0,4)" class="list-row">
                <div>
                  <div class="fw-500">{{ r.title }}</div>
                  <div class="text-sm text-muted">{{ r.generatedDate | date:'MMM d, y' }}</div>
                </div>
                <span class="badge badge-info">{{ r.scope }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Administrator Dashboard -->
      <ng-container *ngIf="role() === 'Administrator'">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe">👥</div>
            <div class="stat-value">{{ allUsers().length }}</div>
            <div class="stat-label">Total Users</div>
            <div class="stat-delta">{{ activeUsersCount() }} active</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#d1fae5">👤</div>
            <div class="stat-value">{{ totalEmployees() }}</div>
            <div class="stat-label">Employees</div>
            <div class="stat-delta">{{ activeEmployees() }} active</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fee2e2">⚠</div>
            <div class="stat-value">{{ openHazardsTotal() }}</div>
            <div class="stat-label">Open Hazards</div>
            <div class="stat-delta">system-wide</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7">📝</div>
            <div class="stat-value">{{ auditLogs().length }}</div>
            <div class="stat-label">Audit Log Entries</div>
            <div class="stat-delta">all time</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>Recent Audit Log</h3><a routerLink="/audit-log" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let log of auditLogs().slice(0,5)" class="list-row">
                <div>
                  <div class="fw-500">{{ log.resource | slice:0:52 }}</div>
                  <div class="text-sm text-muted">{{ log.userName }} · {{ log.timestamp | date:'MMM d, HH:mm' }}</div>
                </div>
                <span class="badge badge-neutral">{{ log.action }}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>User Breakdown</h3><a routerLink="/users" class="btn btn-sm btn-outline">Manage</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let g of userGroups()" class="list-row">
                <div class="fw-500">{{ g.role }}</div>
                <div style="display:flex;align-items:center;gap:12px">
                  <div class="mini-bar-wrap"><div class="mini-bar" [style.width.%]="g.pct"></div></div>
                  <span class="fw-600">{{ g.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Compliance Officer Dashboard -->
      <ng-container *ngIf="role() === 'Compliance Officer'">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:#d1fae5">✓</div>
            <div class="stat-value">{{ compliantCount() }}</div>
            <div class="stat-label">Compliant Records</div>
            <div class="stat-delta">{{ complianceRate() }}% rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fee2e2">✗</div>
            <div class="stat-value">{{ nonCompliantCount() }}</div>
            <div class="stat-label">Non-Compliant</div>
            <div class="stat-delta">requiring remediation</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7">📊</div>
            <div class="stat-value">{{ activeAudits() }}</div>
            <div class="stat-label">Active Audits</div>
            <div class="stat-delta">in progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe">📁</div>
            <div class="stat-value">{{ allCompliance().length }}</div>
            <div class="stat-label">Total Records</div>
            <div class="stat-delta">compliance records</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>Compliance Records</h3><a routerLink="/compliance" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let c of allCompliance().slice(0,5)" class="list-row">
                <div>
                  <div class="fw-500">{{ c.entityDescription }}</div>
                  <div class="text-sm text-muted">{{ c.type }} · {{ c.date | date:'MMM d' }}</div>
                </div>
                <span [class]="complianceBadge(c.result)">{{ c.result }}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Audits</h3><a routerLink="/audits" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let a of allAudits().slice(0,4)" class="list-row">
                <div>
                  <div class="fw-500">{{ a.scope | slice:0:50 }}</div>
                  <div class="text-sm text-muted">{{ a.officerName }} · {{ a.date | date:'MMM d' }}</div>
                </div>
                <span [class]="auditBadge(a.status)">{{ a.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- Government Auditor Dashboard -->
      <ng-container *ngIf="role() === 'Government Auditor'">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:#d1fae5">📊</div>
            <div class="stat-value">{{ complianceRate() }}%</div>
            <div class="stat-label">Overall Compliance Rate</div>
            <div class="stat-delta">across all categories</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fee2e2">⚠</div>
            <div class="stat-value">{{ openHazardsTotal() }}</div>
            <div class="stat-label">Open Hazards</div>
            <div class="stat-delta">system-wide</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe">🔍</div>
            <div class="stat-value">{{ completedInspections() }}</div>
            <div class="stat-label">Completed Inspections</div>
            <div class="stat-delta">this period</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7">📈</div>
            <div class="stat-value">{{ allReports().length }}</div>
            <div class="stat-label">Available Reports</div>
            <div class="stat-delta">for review</div>
          </div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>Compliance Overview</h3><a routerLink="/compliance" class="btn btn-sm btn-outline">Details</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let c of allCompliance().slice(0,5)" class="list-row">
                <div>
                  <div class="fw-500">{{ c.entityDescription }}</div>
                  <div class="text-sm text-muted">{{ c.type }} · {{ c.date | date:'MMM d' }}</div>
                </div>
                <span [class]="complianceBadge(c.result)">{{ c.result }}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3>Recent Reports</h3><a routerLink="/reports" class="btn btn-sm btn-outline">View All</a></div>
            <div class="card-body" style="padding:0">
              <div *ngFor="let r of allReports()" class="list-row">
                <div>
                  <div class="fw-500">{{ r.title }}</div>
                  <div class="text-sm text-muted">{{ r.generatedDate | date:'MMM d, y' }}</div>
                </div>
                <span class="badge badge-info">{{ r.scope }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
    .list-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
    .list-row:last-child { border-bottom: none; }
    .fw-500 { font-weight: 500; font-size: 13.5px; }
    .mini-bar-wrap { width: 80px; height: 6px; background: var(--border); border-radius: 4px; overflow: hidden; }
    .mini-bar { height: 100%; background: var(--primary-light); border-radius: 4px; transition: width .3s; }
  `],
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private data = inject(MockDataService);
  private hazardService = inject(HazardService);
  private trainingService = inject(TrainingService);
  private programService = inject(ProgramService);
  private incidentService = inject(IncidentService);
  private inspectionService = inject(InspectionService);

  today = new Date();
  user = this.auth.currentUser;
  role = this.auth.userRole;
  firstName = computed(() => this.user()?.name?.split(' ')[0] ?? '');

  allHazards = this.data.hazards;
  allIncidents = this.data.incidents;
  allInspections = this.data.inspections;
  allPrograms = this.data.programs;
  allReports = this.data.reports;
  allUsers = this.data.users;
  allEmployees = this.data.employees;
  allCompliance = this.data.complianceRecords;
  allAudits = this.data.audits;
  auditLogs = this.data.auditLogs;

  // Live Data for Employee
  empHazards = signal<HazardReportProjection[]>([]);
  empTrainings = signal<Training[]>([]);
  empPrograms = signal<Program[]>([]);

  // Live Data for Safety Officer
  soHazards = signal<HazardReportProjection[]>([]);
  soIncidents = signal<IncidentReportProjection[]>([]);
  soInspections = signal<InspectionResponseDTO[]>([]);

  ngOnInit() {
    if (this.role() === 'Employee') {
      const uid = Number(this.user()?.userId ?? 0);
      this.hazardService.getHazardsByEmployee(uid).then(res => this.empHazards.set(res || [])).catch(console.error);
      this.trainingService.getTrainingsByEmployee(uid).then(res => this.empTrainings.set(res || [])).catch(console.error);
      this.programService.getAllPrograms().then(res => this.empPrograms.set(res || [])).catch(console.error);
    } else if (this.role() === 'Safety Officer' || this.role() === 'Hazard Officer') {
      this.hazardService.getAllHazards().then(res => this.soHazards.set(res || [])).catch(console.error);
      this.incidentService.getAllIncidents().then(res => this.soIncidents.set(res || [])).catch(console.error);
      this.inspectionService.getAllInspections().then(res => this.soInspections.set(res || [])).catch(console.error);
    }
  }

  myHazards = computed(() => this.empHazards());
  myTrainings = computed(() => this.empTrainings());
  myUnread = computed(() => this.data.getUnreadCount(this.user()?.userId ?? ''));
  openHazards = computed(() => this.empHazards().filter(h => h.hazardStatus === 'PENDING').length);
  completedTrainings = computed(() => this.empTrainings().filter(t => t.trainingStatus === 'COMPLETED').length);
  trainingRate = computed(() => {
    const t = this.empTrainings();
    if (!t.length) return 0;
    return Math.round((this.completedTrainings() / t.length) * 100);
  });

  empTrainingsView = computed(() => {
    return this.empTrainings().map(t => {
      const p = this.empPrograms().find(pr => Number(pr.programId) === Number(t.programId));
      return {
        ...t,
        programTitle: p ? p.programTitle : `Program #${t.programId}`
      };
    });
  });

  openIncidents = computed(() => this.soIncidents().filter(i => i.status === 'Open' || i.status === 'In Progress' || i.status === 'PENDING').length);
  criticalHazards = computed(() => this.soHazards().filter(h => h.hazardStatus === 'PENDING').length);
  highHazards = computed(() => 0);
  scheduledInspections = computed(() => this.soInspections().filter(i => i.status === 'Scheduled').length);
  completedInspections = computed(() => this.soInspections().filter(i => i.status === 'Completed').length);
  openHazardsTotal = computed(() => this.allHazards().filter(h => h.status === 'Open' || h.status === 'Under Investigation').length);
  activePrograms = computed(() => this.allPrograms().filter(p => p.status === 'Active').length);
  plannedPrograms = computed(() => this.allPrograms().filter(p => p.status === 'Planned').length);
  totalEmployees = computed(() => this.allEmployees().length);
  activeEmployees = computed(() => this.allEmployees().filter(e => e.status === 'Active').length);
  activeUsersCount = computed(() => this.allUsers().filter(u => u.status === 'Active').length);
  overallTrainingRate = computed(() => {
    const t = this.data.trainings();
    if (!t.length) return 0;
    return Math.round((t.filter(x => x.status === 'Completed').length / t.length) * 100);
  });
  compliantCount = computed(() => this.allCompliance().filter(c => c.result === 'Compliant').length);
  nonCompliantCount = computed(() => this.allCompliance().filter(c => c.result === 'Non-Compliant').length);
  complianceRate = computed(() => {
    const total = this.allCompliance().length;
    if (!total) return 0;
    return Math.round((this.compliantCount() / total) * 100);
  });
  activeAudits = computed(() => this.allAudits().filter(a => a.status === 'In Progress').length);
  userGroups = computed(() => {
    const users = this.allUsers();
    const roles = ['Employee', 'Safety Officer', 'Hazard Officer', 'Manager', 'Administrator', 'Compliance Officer', 'Government Auditor'] as const;
    const max = Math.max(...roles.map(r => users.filter(u => u.role === r).length), 1);
    return roles.map(r => ({ role: r, count: users.filter(u => u.role === r).length, pct: (users.filter(u => u.role === r).length / max) * 100 }));
  });

  private getEmployeeId(): string {
    const userId = this.user()?.userId ?? '';
    return this.allEmployees().find(e => e.userId === userId)?.employeeId ?? 'e1';
  }

  severityBadge(s: string): string {
    const map: Record<string, string> = { Critical: 'badge badge-danger', High: 'badge badge-warning', Medium: 'badge badge-info', Low: 'badge badge-neutral' };
    return map[s] ?? 'badge badge-neutral';
  }
  statusBadge(s: string): string {
    const map: Record<string, string> = { PENDING: 'badge badge-warning', COMPLETED: 'badge badge-success', Open: 'badge badge-danger', 'Under Investigation': 'badge badge-warning', Resolved: 'badge badge-success', Closed: 'badge badge-neutral' };
    return map[s] ?? 'badge badge-neutral';
  }
  getTrainingStatusLabel(s: string): string {
    const map: Record<string, string> = { COMPLETED: 'Completed', IN_PROGRESS: 'In Progress', ENROLLED: 'Enrolled', FAILED: 'Failed' };
    return map[s] ?? s;
  }
  trainingBadge(s: string): string {
    const map: Record<string, string> = { COMPLETED: 'badge badge-success', IN_PROGRESS: 'badge badge-info', ENROLLED: 'badge badge-primary', FAILED: 'badge badge-danger', Completed: 'badge badge-success', 'In Progress': 'badge badge-info', Enrolled: 'badge badge-primary', Failed: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }
  incidentBadge(s: string): string {
    const map: Record<string, string> = { Open: 'badge badge-danger', 'In Progress': 'badge badge-warning', Resolved: 'badge badge-success', Closed: 'badge badge-neutral' };
    return map[s] ?? 'badge badge-neutral';
  }
  programBadge(s: string): string {
    const map: Record<string, string> = { Active: 'badge badge-success', Planned: 'badge badge-primary', Completed: 'badge badge-neutral', Cancelled: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }
  complianceBadge(s: string): string {
    const map: Record<string, string> = { Compliant: 'badge badge-success', 'Non-Compliant': 'badge badge-danger', Partial: 'badge badge-warning' };
    return map[s] ?? 'badge badge-neutral';
  }
  auditBadge(s: string): string {
    const map: Record<string, string> = { Planned: 'badge badge-primary', 'In Progress': 'badge badge-warning', Completed: 'badge badge-success', Cancelled: 'badge badge-danger' };
    return map[s] ?? 'badge badge-neutral';
  }
}

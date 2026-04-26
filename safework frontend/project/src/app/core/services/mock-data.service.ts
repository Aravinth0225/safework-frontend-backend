import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Audit, AuditLog, ComplianceCheck, ComplianceRecord, Employee, Hazard, Incident, Inspection, Notification, Program, Report, Training, User, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiBase = 'http://localhost:8099';

  users = signal<User[]>([]);
  employees = signal<Employee[]>([]);
  hazards = signal<Hazard[]>([]);
  incidents = signal<Incident[]>([]);
  inspections = signal<Inspection[]>([]);
  complianceChecks = signal<ComplianceCheck[]>([]);
  programs = signal<Program[]>([]);
  trainings = signal<Training[]>([]);
  complianceRecords = signal<ComplianceRecord[]>([]);
  audits = signal<Audit[]>([]);
  reports = signal<Report[]>([]);
  notifications = signal<Notification[]>([]);
  auditLogs = signal<AuditLog[]>([]);
  operationError = signal('');

  constructor() {
    effect(() => {
      if (this.auth.currentUser()) {
        this.loadAllData();
      } else {
        this.resetAll();
      }
    });
  }

  private loadAllData(): void {
    const headers = { headers: this.auth.getAuthHeaders() };
    forkJoin({
      users: this.http.get<unknown[]>(`${this.apiBase}/users/getAllUsers`, headers).pipe(catchError(() => of([]))),
      employees: this.http.get<unknown[]>(`${this.apiBase}/employees/getall`, headers).pipe(catchError(() => of([]))),
      hazards: this.http.get<unknown[]>(`${this.apiBase}/hazard/getAllHazard`, headers).pipe(catchError(() => of([]))),
      incidents: this.http.get<unknown[]>(`${this.apiBase}/incidents/getAllIncidents`, headers).pipe(catchError(() => of([]))),
      inspections: this.http.get<unknown[]>(`${this.apiBase}/inspections/getallInspection`, headers).pipe(catchError(() => of([]))),
      programs: this.http.get<unknown[]>(`${this.apiBase}/programs/getallprograms`, headers).pipe(catchError(() => of([]))),
      trainings: this.http.get<unknown[]>(`${this.apiBase}/trainings/getalltrainings`, headers).pipe(catchError(() => of([]))),
      complianceRecords: this.http.get<unknown[]>(`${this.apiBase}/complianceRecord/getAllComplianceRecord`, headers).pipe(catchError(() => of([]))),
      audits: this.http.get<unknown[]>(`${this.apiBase}/audit/getAll`, headers).pipe(catchError(() => of([]))),
    }).subscribe(result => {
      this.users.set((result.users ?? []).map(u => this.mapUser(u)));
      this.employees.set((result.employees ?? []).map(e => this.mapEmployee(e)));
      this.hazards.set((result.hazards ?? []).map(h => this.mapHazard(h)));
      this.incidents.set((result.incidents ?? []).map(i => this.mapIncident(i)));
      this.inspections.set((result.inspections ?? []).map(i => this.mapInspection(i)));
      this.programs.set((result.programs ?? []).map(p => this.mapProgram(p)));
      this.trainings.set((result.trainings ?? []).map(t => this.mapTraining(t)));
      this.complianceRecords.set((result.complianceRecords ?? []).map(c => this.mapCompliance(c)));
      this.audits.set((result.audits ?? []).map(a => this.mapAudit(a)));
      this.complianceChecks.set([]);
      this.notifications.set([]);
      this.reports.set([]);
      this.auditLogs.set([]);
      const userId = this.auth.currentUser()?.userId;
      if (userId) {
        this.loadNotifications(userId);
      }
    });
  }

  private loadNotifications(userId: string): void {
    this.http
      .get<unknown[]>(`${this.apiBase}/notifications/${userId}`, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError(() => of([])))
      .subscribe(items => {
        this.notifications.set((items ?? []).map(n => this.mapNotification(n)));
      });
  }

  private resetAll(): void {
    this.users.set([]);
    this.employees.set([]);
    this.hazards.set([]);
    this.incidents.set([]);
    this.inspections.set([]);
    this.complianceChecks.set([]);
    this.programs.set([]);
    this.trainings.set([]);
    this.complianceRecords.set([]);
    this.audits.set([]);
    this.reports.set([]);
    this.notifications.set([]);
    this.auditLogs.set([]);
  }

  getNotificationsForUser(userId: string): Notification[] {
    return this.notifications().filter(n => n.userId === userId);
  }

  getUnreadCount(userId: string): number {
    return this.notifications().filter(n => n.userId === userId && n.status === 'Unread').length;
  }

  markNotificationRead(id: string): void {
    this.notifications.update(list => list.map(n => (n.notificationId === id ? { ...n, status: 'Read' } : n)));
    this.http.put(`${this.apiBase}/notifications/markAsRead/${id}`, {}, { headers: this.auth.getAuthHeaders() }).pipe(catchError(() => of(null))).subscribe();
  }

  addHazard(h: Hazard): void {
    const payload = { employeeId: Number(h.employeeId), hazardDescription: h.description, hazardLocation: h.location, hazardStatus: this.toApiHazardStatus(h.status) };
    this.http.post(`${this.apiBase}/hazard/postHazard`, payload, { headers: this.auth.getAuthHeaders() }).pipe(catchError(() => of(null))).subscribe(() => this.loadAllData());
  }

  updateHazard(h: Hazard): void {
    const payload = { hazardDescription: h.description, hazardLocation: h.location, hazardStatus: this.toApiHazardStatus(h.status) };
    this.http.put(`${this.apiBase}/hazard/update/${h.hazardId}`, payload, { headers: this.auth.getAuthHeaders() }).pipe(catchError(() => of(null))).subscribe(() => this.loadAllData());
  }

  addEmployee(e: Employee, password: string): void {
    const payload = {
      userName: e.name,
      userEmail: e.email,
      userContact: e.contactInfo,
      userStatus: this.toApiEmployeeStatus(e.status),
      userRole: 'EMPLOYEE',
      password,
      employeeDOB: e.dob || null,
      employeeGender: e.gender || null,
      employeeAddress: e.address || null,
      employeeDepartmentName: e.department || null,
      employeeDocumentType: 'ID_PROOF',
      employeeFileURL: 'N/A',
    };

    this.http.post(`${this.apiBase}/employees/register`, payload, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Employee creation failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  updateEmployee(e: Employee): void {
    const payload = {
      userName: e.name,
      userEmail: e.email,
      userContact: e.contactInfo,
      userStatus: this.toApiEmployeeStatus(e.status),
      employeeDOB: e.dob || null,
      employeeGender: e.gender || null,
      employeeAddress: e.address || null,
      employeeDepartmentName: e.department || null,
    };

    this.http.put(`${this.apiBase}/employees/update/${e.employeeId}`, payload, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Employee update failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  approveEmployee(employeeId: string): void {
    this.http.patch(`${this.apiBase}/employees/approve/${employeeId}`, {}, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Employee approval failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  addUser(u: User): void {
    const payload = {
      userName: u.name,
      userEmail: u.email,
      userContact: u.phone,
      userStatus: u.status.toUpperCase(),
      userRole: this.toApiRole(u.role),
      password: (u.password && u.password.trim().length > 0) ? u.password : 'Default@123',
    };
    this.http.post(`${this.apiBase}/users/register`, payload)
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'User creation failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  updateUser(u: User): void {
    const payload = {
      userName: u.name,
      userEmail: u.email,
      userContact: u.phone,
      userStatus: u.status.toUpperCase(),
      userRole: this.toApiRole(u.role),
      password: (u.password && u.password.trim().length > 0) ? u.password : null,
    };
    this.http.patch(`${this.apiBase}/users/updateUser/${u.userId}`, payload, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'User update failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  addInspection(ins: Inspection): void {
    const payload = { inspectionLocation: ins.location, inspectionFindings: ins.findings, inspectionDate: ins.date };
    this.http.post(`${this.apiBase}/inspections/createInspection`, payload, { headers: this.auth.getAuthHeaders() }).pipe(catchError(() => of(null))).subscribe(() => this.loadAllData());
  }

  addProgram(p: Program): void {
    const payload = { programTitle: p.title, programDescription: p.description, programStartDate: p.startDate, programEndDate: p.endDate, programStatus: p.status.toUpperCase() };
    this.http.post(`${this.apiBase}/programs/createprogram`, payload, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Program creation failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  updateProgram(p: Program): void {
    const payload = { programTitle: p.title, programDescription: p.description, programStartDate: p.startDate, programEndDate: p.endDate, programStatus: p.status.toUpperCase() };
    this.http.put(`${this.apiBase}/programs/updateprogrambyid/${p.programId}`, payload, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Program update failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  deleteProgram(programId: string): void {
    this.http.delete(`${this.apiBase}/programs/deleteprogrambyid/${programId}`, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Program delete failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  addTraining(t: Training): void {
    const payload = {
      trainingCompletionDate: t.completionDate || null,
      trainingStatus: this.toApiTrainingStatus(t.status),
      programId: Number(t.programId),
      employeeId: Number(t.employeeId),
    };

    this.http.post(`${this.apiBase}/trainings/createtraining`, payload, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Training creation failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  updateTraining(t: Training): void {
    const payload = {
      trainingCompletionDate: t.completionDate || null,
      trainingStatus: this.toApiTrainingStatus(t.status),
      programId: Number(t.programId),
      employeeId: Number(t.employeeId),
    };

    this.http.put(`${this.apiBase}/trainings/updatetrainingbyid/${t.trainingId}`, payload, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Training update failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  deleteTraining(trainingId: string): void {
    this.http.delete(`${this.apiBase}/trainings/deletetrainingbyid/${trainingId}`, { headers: this.auth.getAuthHeaders() })
      .pipe(catchError((error) => {
        this.operationError.set(this.extractError(error, 'Training delete failed.'));
        return of(null);
      }))
      .subscribe(response => {
        if (response !== null) {
          this.operationError.set('');
          this.loadAllData();
        }
      });
  }

  addAudit(a: Audit): void {
    const payload = { auditScope: 'FULL_SITE', auditFinding: a.findings || 'Created from UI', auditDate: a.date, auditStatus: 'OPEN' };
    this.http.post(`${this.apiBase}/audit/createAudit`, payload, { headers: this.auth.getAuthHeaders() }).pipe(catchError(() => of(null))).subscribe(() => this.loadAllData());
  }

  private mapUser(raw: unknown): User {
    const r = raw as Record<string, unknown>;
    return {
      userId: String(r['userId'] ?? ''),
      name: String(r['userName'] ?? ''),
      role: this.toUiRole(String(r['userRole'] ?? 'EMPLOYEE')),
      email: String(r['userEmail'] ?? ''),
      phone: String(r['userContact'] ?? ''),
      status: this.toUiUserStatus(String(r['userStatus'] ?? 'ACTIVE')),
      department: '',
    };
  }

  private mapEmployee(raw: unknown): Employee {
    const r = raw as Record<string, unknown>;
    return {
      employeeId: String(r['employeeId'] ?? ''),
      name: String(r['employeeName'] ?? ''),
      dob: '',
      gender: 'Other',
      address: '',
      contactInfo: String(r['email'] ?? ''),
      department: String(r['employeeDepartmentName'] ?? ''),
      status: this.toUiEmployeeStatus(String(r['employeeStatus'] ?? 'ACTIVE')),
      email: String(r['email'] ?? ''),
    };
  }

  private mapHazard(raw: unknown): Hazard {
    const r = raw as Record<string, unknown>;
    const status = String(r['hazardStatus'] ?? 'PENDING').toUpperCase() === 'COMPLETED' ? 'Resolved' : 'Open';
    return {
      hazardId: String(r['hazardId'] ?? ''),
      employeeId: String(r['employeeId'] ?? ''),
      employeeName: '',
      description: String(r['hazardDescription'] ?? ''),
      location: String(r['hazardLocation'] ?? ''),
      date: String(r['hazardDate'] ?? ''),
      status,
      severity: 'Medium',
    };
  }

  private mapIncident(raw: unknown): Incident {
    const r = raw as Record<string, unknown>;
    return {
      incidentId: String(r['incidentId'] ?? ''),
      hazardId: '',
      officerId: String(r['officerId'] ?? ''),
      officerName: '',
      actions: String(r['action'] ?? ''),
      date: String(r['incidentDate'] ?? ''),
      status: 'In Progress',
      hazardDescription: '',
    };
  }

  private mapInspection(raw: unknown): Inspection {
    const r = raw as Record<string, unknown>;
    return {
      inspectionId: String(r['inspectionId'] ?? ''),
      officerId: String(r['officerId'] ?? ''),
      officerName: '',
      location: String(r['inspectionLocation'] ?? ''),
      findings: String(r['inspectionFindings'] ?? ''),
      date: String(r['inspectionDate'] ?? ''),
      status: this.toUiInspectionStatus(String(r['inspectionStatus'] ?? 'SCHEDULED')),
    };
  }

  private mapProgram(raw: unknown): Program {
    const r = raw as Record<string, unknown>;
    return {
      programId: String(r['programId'] ?? ''),
      title: String(r['programTitle'] ?? ''),
      description: String(r['programDescription'] ?? ''),
      startDate: String(r['programStartDate'] ?? ''),
      endDate: String(r['programEndDate'] ?? ''),
      status: this.toUiProgramStatus(String(r['programStatus'] ?? 'PLANNED')),
    };
  }

  private mapTraining(raw: unknown): Training {
    const r = raw as Record<string, unknown>;
    const programId = String(r['programId'] ?? '');
    const employeeId = String(r['employeeId'] ?? '');
    const matchedProgram = this.programs().find(p => p.programId === programId);
    const matchedEmployee = this.employees().find(e => e.employeeId === employeeId);

    return {
      trainingId: String(r['id'] ?? ''),
      programId,
      programTitle: matchedProgram?.title ?? `Program #${programId}`,
      employeeId,
      employeeName: matchedEmployee?.name ?? `Employee #${employeeId}`,
      completionDate: String(r['trainingCompletionDate'] ?? ''),
      status: this.toUiTrainingStatus(String(r['trainingStatus'] ?? 'NOT_STARTED')),
    };
  }

  private mapCompliance(raw: unknown): ComplianceRecord {
    const r = raw as Record<string, unknown>;
    return {
      complianceId: String(r['complianceId'] ?? ''),
      entityId: String(r['entityId'] ?? ''),
      type: this.toUiComplianceType(String(r['entityType'] ?? 'Hazard')),
      result: this.toUiComplianceResult(String(r['complianceResult'] ?? 'NOT_APPLICABLE')),
      date: String(r['complianceDate'] ?? ''),
      notes: String(r['complianceNotes'] ?? ''),
    };
  }

  private mapAudit(raw: unknown): Audit {
    const r = raw as Record<string, unknown>;
    return {
      auditId: String(r['auditId'] ?? ''),
      officerId: String(r['officerId'] ?? ''),
      officerName: String(r['officerName'] ?? ''),
      scope: String(r['auditScope'] ?? ''),
      findings: String(r['auditFinding'] ?? ''),
      date: String(r['auditDate'] ?? ''),
      status: this.toUiAuditStatus(String(r['auditStatus'] ?? 'PENDING')),
    };
  }

  private mapNotification(raw: unknown): Notification {
    const r = raw as Record<string, unknown>;
    return {
      notificationId: String(r['notificationId'] ?? ''),
      userId: String(r['userId'] ?? ''),
      entityId: String(r['entityId'] ?? ''),
      message: String(r['message'] ?? ''),
      category: this.toUiNotificationCategory(String(r['category'] ?? 'GENERAL')),
      status: String(r['status'] ?? '').toUpperCase() === 'READ' ? 'Read' : 'Unread',
      createdDate: String(r['createdDate'] ?? ''),
    };
  }

  private toUiRole(role: string): UserRole {
    const map: Record<string, UserRole> = {
      ADMIN: 'Administrator',
      COMPLIANCE_OFFICER: 'Compliance Officer',
      SAFETY_OFFICER: 'Safety Officer',
      HAZARD_OFFICER: 'Hazard Officer',
      EMPLOYEE: 'Employee',
    };
    return map[role.toUpperCase()] ?? 'Employee';
  }

  private toApiRole(role: UserRole): string {
    const map: Record<UserRole, string> = {
      Employee: 'EMPLOYEE',
      'Safety Officer': 'SAFETY_OFFICER',
      'Hazard Officer': 'HAZARD_OFFICER',
      Manager: 'SAFETY_OFFICER',
      Administrator: 'ADMIN',
      'Compliance Officer': 'COMPLIANCE_OFFICER',
      'Government Auditor': 'COMPLIANCE_OFFICER',
    };
    return map[role] ?? 'EMPLOYEE';
  }

  private toUiTrainingStatus(status: string): Training['status'] {
    const map: Record<string, Training['status']> = {
      NOT_STARTED: 'Enrolled',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
      PLANNED: 'Enrolled',
    };
    return map[status.toUpperCase()] ?? 'Enrolled';
  }

  private toApiTrainingStatus(status: Training['status']): string {
    const map: Record<Training['status'], string> = {
      Enrolled: 'NOT_STARTED',
      'In Progress': 'IN_PROGRESS',
      Completed: 'COMPLETED',
      Failed: 'FAILED',
    };
    return map[status] ?? 'NOT_STARTED';
  }

  private toUiProgramStatus(status: string): Program['status'] {
    const map: Record<string, Program['status']> = {
      PLANNED: 'Planned',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return map[status.toUpperCase()] ?? 'Planned';
  }

  private toUiInspectionStatus(status: string): Inspection['status'] {
    const map: Record<string, Inspection['status']> = {
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    return map[status.toUpperCase()] ?? 'Scheduled';
  }

  private toUiComplianceType(type: string): ComplianceRecord['type'] {
    const normalized = type.toLowerCase();
    if (normalized.includes('inspection')) return 'Inspection';
    if (normalized.includes('program')) return 'Program';
    return 'Hazard';
  }

  private toUiComplianceResult(result: string): ComplianceRecord['result'] {
    const map: Record<string, ComplianceRecord['result']> = {
      COMPLIANT: 'Compliant',
      NON_COMPLIANT: 'Non-Compliant',
      PARTIALLY_COMPLIANT: 'Partial',
      NOT_APPLICABLE: 'Partial',
    };
    return map[result.toUpperCase()] ?? 'Partial';
  }

  private toUiAuditStatus(status: string): Audit['status'] {
    const map: Record<string, Audit['status']> = {
      OPEN: 'In Progress',
      CLOSED: 'Completed',
      PENDING: 'Planned',
    };
    return map[status.toUpperCase()] ?? 'Planned';
  }

  private toUiNotificationCategory(category: string): Notification['category'] {
    if (category.includes('HAZARD')) return 'Hazard';
    if (category.includes('TRAINING')) return 'Program';
    if (category.includes('INCIDENT')) return 'Inspection';
    if (category.includes('COMPLIANCE')) return 'Compliance';
    return 'Program';
  }

  private toApiHazardStatus(status: Hazard['status']): string {
    if (status === 'Resolved' || status === 'Closed') return 'COMPLETED';
    return 'PENDING';
  }

  private toApiEmployeeStatus(status: Employee['status']): string {
    const map: Record<Employee['status'], string> = {
      Active: 'ACTIVE',
      Inactive: 'INACTIVE',
      Pending: 'PENDING',
      Terminated: 'TERMINATED',
    };
    return map[status] ?? 'ACTIVE';
  }

  private extractError(error: unknown, fallback: string): string {
    const err = error as { error?: { message?: string } | string; message?: string };
    if (typeof err?.error === 'string' && err.error.length > 0) return err.error;
    if (typeof err?.error === 'object' && err.error?.message) return err.error.message;
    if (err?.message) return err.message;
    return fallback;
  }

  private toUiUserStatus(status: string): User['status'] {
    const upper = status.toUpperCase();
    if (upper === 'INACTIVE') return 'Inactive';
    if (upper === 'PENDING') return 'Pending';
    return 'Active';
  }

  private toUiEmployeeStatus(status: string): Employee['status'] {
    const upper = status.toUpperCase();
    if (upper === 'INACTIVE') return 'Inactive';
    if (upper === 'PENDING') return 'Pending';
    if (upper === 'TERMINATED') return 'Terminated';
    return 'Active';
  }
}

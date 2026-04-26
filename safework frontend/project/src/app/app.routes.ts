import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'employee-register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/employee-register.component').then(m => m.EmployeeRegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'employees', loadComponent: () => import('./features/employees/employee-list.component').then(m => m.EmployeeListComponent) },
      { path: 'employee-verification', loadComponent: () => import('./features/employees/employee-verification.component').then(m => m.EmployeeVerificationComponent) },
      { path: 'hazards', loadComponent: () => import('./features/hazards/hazard-list.component').then(m => m.HazardListComponent) },
      { path: 'incidents', loadComponent: () => import('./features/incidents/incident-list.component').then(m => m.IncidentListComponent) },
      { path: 'inspections', loadComponent: () => import('./features/inspections/inspection-list.component').then(m => m.InspectionListComponent) },
      { path: 'compliance-checks', loadComponent: () => import('./features/compliance-checks/compliance-check-list.component').then(m => m.ComplianceCheckListComponent) },
      { path: 'programs', loadComponent: () => import('./features/programs/program-list.component').then(m => m.ProgramListComponent) },
      { path: 'trainings', loadComponent: () => import('./features/trainings/training-list.component').then(m => m.TrainingListComponent) },
      { path: 'compliance', loadComponent: () => import('./features/compliance/compliance-list.component').then(m => m.ComplianceListComponent) },
      { path: 'audits', loadComponent: () => import('./features/audits/audit-list.component').then(m => m.AuditListComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'users', loadComponent: () => import('./features/users/user-list.component').then(m => m.UserListComponent) },
      { path: 'audit-log', loadComponent: () => import('./features/audit-log/audit-log.component').then(m => m.AuditLogComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

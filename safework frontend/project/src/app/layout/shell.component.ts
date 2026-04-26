import { Component, computed, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { MockDataService } from '../core/services/mock-data.service';
import { UserRole } from '../core/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: '⊞', route: '/dashboard', roles: ['Employee', 'Safety Officer', 'Hazard Officer', 'Manager', 'Administrator', 'Compliance Officer', 'Government Auditor'] },
  { label: 'My Hazards', icon: '⚠', route: '/hazards', roles: ['Employee'] },
  { label: 'Hazard Reports', icon: '⚠', route: '/hazards', roles: ['Safety Officer', 'Hazard Officer', 'Manager', 'Administrator', 'Compliance Officer', 'Government Auditor'] },
  { label: 'Incidents', icon: '🔔', route: '/incidents', roles: ['Safety Officer', 'Hazard Officer', 'Manager', 'Administrator', 'Compliance Officer'] },
  { label: 'Inspections', icon: '🔍', route: '/inspections', roles: ['Safety Officer', 'Hazard Officer', 'Manager', 'Administrator', 'Compliance Officer', 'Government Auditor'] },
  { label: 'Compliance Checks', icon: '✓', route: '/compliance-checks', roles: ['Safety Officer', 'Hazard Officer', 'Administrator', 'Compliance Officer', 'Government Auditor'] },
  { label: 'Programs', icon: '📋', route: '/programs', roles: ['Manager', 'Administrator', 'Compliance Officer', 'Government Auditor'] },
  { label: 'My Training', icon: '🎓', route: '/trainings', roles: ['Employee'] },
  { label: 'Trainings', icon: '🎓', route: '/trainings', roles: ['Manager', 'Administrator', 'Safety Officer', 'Hazard Officer'] },
  { label: 'Compliance Records', icon: '📁', route: '/compliance', roles: ['Compliance Officer', 'Administrator', 'Government Auditor'] },
  { label: 'Audits', icon: '📊', route: '/audits', roles: ['Compliance Officer', 'Administrator', 'Government Auditor'] },
  { label: 'Reports', icon: '📈', route: '/reports', roles: ['Manager', 'Administrator', 'Compliance Officer', 'Government Auditor'] },
  { label: 'Employees', icon: '👤', route: '/employees', roles: ['Manager', 'Administrator', 'Safety Officer', 'Hazard Officer'] },
  { label: 'Employee Verification', icon: '✅', route: '/employee-verification', roles: ['Administrator'] },
  { label: 'Users', icon: '👥', route: '/users', roles: ['Administrator'] },
  { label: 'Audit Log', icon: '📝', route: '/audit-log', roles: ['Administrator', 'Government Auditor'] },
  { label: 'Notifications', icon: '🔔', route: '/notifications', roles: ['Employee', 'Safety Officer', 'Hazard Officer', 'Manager', 'Administrator', 'Compliance Officer', 'Government Auditor'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf, NgClass],
  template: `
    <div class="shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-logo">
          <div class="logo-icon">SW</div>
          <span class="logo-text">SafeWork</span>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Navigation</div>
          <a *ngFor="let item of visibleNav()"
             [routerLink]="item.route"
             routerLinkActive="active"
             class="nav-item">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
            <span *ngIf="item.route === '/notifications' && unreadCount() > 0" class="nav-badge">{{ unreadCount() }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-info">
              <div class="user-name">{{ currentUser()?.name }}</div>
              <div class="user-role">{{ currentUser()?.role }}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm logout-btn" (click)="logout()">⏻ Logout</button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="main-wrap">
        <header class="top-bar">
          <button class="btn btn-ghost btn-icon sidebar-toggle" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="top-bar-title">{{ pageTitle() }}</div>
          <div class="top-bar-actions">
            <a routerLink="/notifications" class="btn btn-ghost btn-icon notif-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span *ngIf="unreadCount() > 0" class="notif-dot">{{ unreadCount() }}</span>
            </a>
            <div class="user-pill">
              <div class="user-avatar sm">{{ initials() }}</div>
              <span>{{ currentUser()?.name }}</span>
            </div>
          </div>
        </header>
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Mobile overlay -->
    <div class="sidebar-overlay" *ngIf="!sidebarCollapsed()" (click)="sidebarCollapsed.set(true)"></div>
  `,
  styles: [`
    .shell { display: flex; height: 100vh; overflow: hidden; }

    /* Sidebar */
    .sidebar { width: var(--sidebar-w); background: var(--primary); color: #fff; display: flex; flex-direction: column; flex-shrink: 0; transition: width .25s ease; overflow: hidden; }
    .sidebar.collapsed { width: 0; }

    .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,.12); flex-shrink: 0; }
    .logo-icon { width: 36px; height: 36px; background: #fff; color: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .logo-text { font-size: 16px; font-weight: 700; white-space: nowrap; letter-spacing: -.01em; }

    .sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
    .nav-section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.45); padding: 8px 8px 4px; white-space: nowrap; }

    .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; color: rgba(255,255,255,.75); font-size: 13.5px; font-weight: 500; text-decoration: none; transition: all .15s; white-space: nowrap; position: relative; }
    .nav-item:hover { background: rgba(255,255,255,.12); color: #fff; text-decoration: none; }
    .nav-item.active { background: rgba(255,255,255,.18); color: #fff; }
    .nav-icon { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; }
    .nav-label { flex: 1; }
    .nav-badge { background: var(--danger); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 10px; min-width: 18px; text-align: center; }

    .sidebar-footer { padding: 12px 8px; border-top: 1px solid rgba(255,255,255,.12); display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
    .user-card { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; background: rgba(255,255,255,.08); }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .user-avatar.sm { width: 28px; height: 28px; font-size: 11px; background: var(--primary-lighter); color: var(--primary); }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: rgba(255,255,255,.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .logout-btn { color: rgba(255,255,255,.65); width: 100%; justify-content: center; }
    .logout-btn:hover { background: rgba(255,255,255,.1); color: #fff; }

    /* Top bar */
    .main-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
    .top-bar { height: var(--header-h); background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; padding: 0 20px; flex-shrink: 0; box-shadow: var(--shadow); z-index: 10; }
    .sidebar-toggle { color: var(--text-muted); flex-shrink: 0; }
    .top-bar-title { font-size: 15px; font-weight: 600; color: var(--text); flex: 1; }
    .top-bar-actions { display: flex; align-items: center; gap: 8px; }
    .notif-btn { position: relative; color: var(--text-muted); }
    .notif-dot { position: absolute; top: 4px; right: 4px; background: var(--danger); color: #fff; font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 8px; min-width: 16px; text-align: center; }
    .user-pill { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--text); background: var(--bg); padding: 4px 10px 4px 4px; border-radius: 20px; border: 1px solid var(--border); }

    /* Main */
    .main-content { flex: 1; overflow-y: auto; }

    /* Overlay */
    .sidebar-overlay { display: none; }
    @media (max-width: 768px) {
      .sidebar { position: fixed; left: 0; top: 0; height: 100%; z-index: 100; }
      .sidebar.collapsed { width: 0; }
      .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 99; }
    }
  `],
})
export class ShellComponent {
  private auth = inject(AuthService);
  private data = inject(MockDataService);
  private router = inject(Router);

  currentUser = this.auth.currentUser;
  sidebarCollapsed = signal(false);

  initials = computed(() => {
    const name = this.currentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  });

  visibleNav = computed(() => {
    const role = this.currentUser()?.role;
    if (!role) return [];
    return NAV_ITEMS.filter(item => item.roles.includes(role));
  });

  unreadCount = computed(() => {
    const uid = this.currentUser()?.userId ?? '';
    return this.data.getUnreadCount(uid);
  });

  pageTitle = computed(() => {
    const url = this.router.url;
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/employees': 'Employees',
      '/employee-verification': 'Employee Verification',
      '/hazards': 'Hazard Reports',
      '/incidents': 'Incidents',
      '/inspections': 'Inspections',
      '/compliance-checks': 'Compliance Checks',
      '/programs': 'Safety Programs',
      '/trainings': 'Training Records',
      '/compliance': 'Compliance Records',
      '/audits': 'Audits',
      '/reports': 'Reports & Analytics',
      '/notifications': 'Notifications',
      '/users': 'User Management',
      '/audit-log': 'Audit Log',
    };
    return titles[url] ?? 'SafeWork';
  });

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

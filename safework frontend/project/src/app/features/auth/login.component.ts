import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="login-brand">
          <div class="brand-logo">SW</div>
          <div class="brand-name">SafeWork</div>
        </div>
        <h1 class="login-headline">Workplace Safety,<br>Simplified.</h1>
        <p class="login-desc">A unified platform for hazard reporting, safety inspections, compliance tracking, and workplace safety program management.</p>
        <div class="feature-list">
          <div class="feature-item" *ngFor="let f of features">
            <span class="feature-icon">{{ f.icon }}</span>
            <span>{{ f.text }}</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <h2 class="login-title">Sign in to SafeWork</h2>
          <p class="login-sub">Sign in with approved account credentials.</p>

          <div *ngIf="error()" class="alert alert-danger" style="margin-bottom:16px">
            <span>⚠</span> {{ error() }}
          </div>

          <form (ngSubmit)="submit()" #loginForm="ngForm">
            <div class="form-group" style="margin-bottom:14px">
              <label class="form-label">Email Address</label>
              <input type="email" name="email" [(ngModel)]="email" required class="form-control" placeholder="your@email.com" autocomplete="username" />
            </div>
            <div class="form-group" style="margin-bottom:20px">
              <label class="form-label">Password</label>
              <input type="password" name="password" [(ngModel)]="password" required class="form-control" placeholder="••••••••" autocomplete="current-password" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:11px" [disabled]="loading()">
              {{ loading() ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div style="margin-top:12px;text-align:center">
            <a routerLink="/employee-register" style="font-size:13px;color:var(--primary);text-decoration:none">New employee? Register here</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { display: flex; min-height: 100vh; }

    .login-left { flex: 1; background: linear-gradient(145deg, #1a3c5e 0%, #0f2440 100%); color: #fff; padding: 48px; display: flex; flex-direction: column; justify-content: center; gap: 24px; }
    .login-brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { width: 44px; height: 44px; background: #fff; color: #1a3c5e; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; }
    .brand-name { font-size: 20px; font-weight: 700; }
    .login-headline { font-size: 2.25rem; font-weight: 700; line-height: 1.15; letter-spacing: -.02em; max-width: 400px; }
    .login-desc { font-size: 15px; color: rgba(255,255,255,.75); max-width: 380px; line-height: 1.6; }
    .feature-list { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
    .feature-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: rgba(255,255,255,.85); }
    .feature-icon { font-size: 18px; width: 28px; text-align: center; }

    .login-right { width: 480px; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
    .login-card { width: 100%; max-width: 400px; }
    .login-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 6px; }
    .login-sub { font-size: 13px; color: var(--text-muted); margin-bottom: 24px; }

    @media (max-width: 900px) {
      .login-left { display: none; }
      .login-right { width: 100%; }
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  features = [
    { icon: '⚠', text: 'Hazard reporting & incident management' },
    { icon: '🔍', text: 'Safety inspections & compliance tracking' },
    { icon: '📋', text: 'Workplace safety program oversight' },
    { icon: '📊', text: 'Compliance audits & analytics' },
    { icon: '🔔', text: 'Real-time alerts & notifications' },
  ];

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    const result = await this.auth.login(this.email, this.password);
    this.loading.set(false);
    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set(result.message);
    }
  }
}

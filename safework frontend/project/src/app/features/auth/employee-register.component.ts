import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, EmployeeRegistrationRequest } from '../../core/services/auth.service';

@Component({
  selector: 'app-employee-register',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, RouterLink],
  template: `
    <div class="register-page">
      <div class="register-wrap">
        <a routerLink="/login" class="back-link">← Back to Login</a>

        <div class="card">
          <div class="card-header">
            <h2>Employee Registration</h2>
            <p>Complete the form below to request system access.</p>
          </div>

          <div *ngIf="success()" class="alert alert-success">{{ success() }}</div>
          <div *ngIf="error()" class="alert alert-danger">{{ error() }}</div>

          <form (ngSubmit)="submit()" class="content-grid">
            <section>
              <h3>Personal Information</h3>
              <label>Full Name</label>
              <input class="form-control" [(ngModel)]="form.userName" name="userName" required />
              <label>DOB</label>
              <input type="date" class="form-control" [(ngModel)]="form.employeeDOB" name="employeeDOB" required />
              <label>Gender</label>
              <select class="form-control" [(ngModel)]="form.employeeGender" name="employeeGender" required>
                <option value="" disabled>Select...</option>
                <option *ngFor="let g of genders" [value]="g">{{ g }}</option>
              </select>
              <label>Email Address</label>
              <input type="email" class="form-control" [(ngModel)]="form.userEmail" name="userEmail" required />
              <label>Contact Phone</label>
              <input class="form-control" [(ngModel)]="form.userContact" name="userContact" required />
              <label>Password</label>
              <input type="password" class="form-control" [(ngModel)]="form.password" name="password" required minlength="6" />
              <label>Home Address</label>
              <textarea class="form-control" [(ngModel)]="form.employeeAddress" name="employeeAddress" rows="3" required></textarea>
            </section>

            <section>
              <h3>Work Information</h3>
              <label>Department</label>
              <select class="form-control" [(ngModel)]="form.employeeDepartmentName" name="employeeDepartmentName" required>
                <option value="" disabled>Select Department...</option>
                <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
              </select>
              <label>Document Type</label>
              <select class="form-control" [(ngModel)]="form.employeeDocumentType" name="employeeDocumentType" required>
                <option value="" disabled>Select document type...</option>
                <option value="ID_PROOF">ID Proof</option>
                <option value="TRAINING_CERTIFICATE">Training Certificate</option>
              </select>
              <label>Document URL / Path</label>
              <input class="form-control" [(ngModel)]="form.employeeFileURL" name="employeeFileURL" placeholder="e.g. docs/id-proof.pdf" required />
              <div class="pending-note">
                Initial Status: <strong>Pending Approval</strong><br />
                You can login only after admin activates your account.
              </div>
            </section>

            <div class="actions">
              <button type="button" class="btn btn-outline" (click)="router.navigate(['/login'])">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="loading()">{{ loading() ? 'Submitting...' : 'Submit Registration' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page { min-height: 100vh; background: var(--bg); padding: 24px; }
    .register-wrap { max-width: 980px; margin: 0 auto; }
    .back-link { color: var(--text-muted); text-decoration: none; font-size: 13px; display: inline-block; margin-bottom: 12px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .card-header { padding: 18px; border-bottom: 1px solid var(--border); }
    .card-header h2 { margin: 0; font-size: 22px; }
    .card-header p { margin: 6px 0 0; color: var(--text-muted); font-size: 13px; }
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 18px; }
    section h3 { margin: 0 0 12px; font-size: 18px; }
    label { display: block; margin: 10px 0 6px; font-size: 12px; color: var(--text-muted); }
    .pending-note { margin-top: 14px; padding: 10px; border: 1px dashed var(--border); border-radius: 8px; font-size: 12px; color: var(--text-muted); background: #fafafa; }
    .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border); padding-top: 14px; }
    .alert { margin: 12px 18px 0; }
    @media (max-width: 820px) { .content-grid { grid-template-columns: 1fr; } }
  `],
})
export class EmployeeRegisterComponent {
  private auth = inject(AuthService);
  readonly router = inject(Router);

  loading = signal(false);
  error = signal('');
  success = signal('');

  genders = ['Male', 'Female', 'Other'];
  departments = ['Manufacturing', 'Safety', 'Operations', 'Compliance', 'Maintenance', 'Warehouse', 'Quality'];

  form: EmployeeRegistrationRequest = {
    userName: '',
    userEmail: '',
    userContact: '',
    password: '',
    employeeDOB: '',
    employeeGender: '',
    employeeAddress: '',
    employeeDepartmentName: '',
    employeeDocumentType: '',
    employeeFileURL: '',
  };

  async submit(): Promise<void> {
    this.error.set('');
    this.success.set('');
    this.loading.set(true);

    const result = await this.auth.registerEmployee(this.form);
    this.loading.set(false);

    if (!result.success) {
      this.error.set(result.message);
      return;
    }

    this.success.set(result.message);
    setTimeout(() => this.router.navigate(['/login']), 1200);
  }
}

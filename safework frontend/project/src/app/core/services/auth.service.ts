import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, UserRole } from '../models';

const DEMO_USERS: User[] = [
  { userId: 'u1', name: 'Alice Johnson', role: 'Employee', email: 'employee@safework.com', phone: '555-0101', status: 'Active', department: 'Manufacturing' },
  { userId: 'u2', name: 'Bob Martinez', role: 'Safety Officer', email: 'officer@safework.com', phone: '555-0102', status: 'Active', department: 'Safety' },
  { userId: 'u7', name: 'Hector Grant', role: 'Hazard Officer', email: 'hazard@safework.com', phone: '555-0107', status: 'Active', department: 'Safety' },
  { userId: 'u3', name: 'Carol Davis', role: 'Manager', email: 'manager@safework.com', phone: '555-0103', status: 'Active', department: 'Operations' },
  { userId: 'u4', name: 'David Kim', role: 'Administrator', email: 'admin@safework.com', phone: '555-0104', status: 'Active', department: 'IT' },
  { userId: 'u5', name: 'Eva Torres', role: 'Compliance Officer', email: 'compliance@safework.com', phone: '555-0105', status: 'Active', department: 'Compliance' },
  { userId: 'u6', name: 'Frank Wilson', role: 'Government Auditor', email: 'auditor@safework.com', phone: '555-0106', status: 'Active', department: 'Regulatory' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:8099';
  private _currentUser = signal<User | null>(this.loadFromStorage());

  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => this._currentUser() !== null);
  userRole = computed(() => this._currentUser()?.role ?? null);

  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const payload = { email, password };
      const response = await firstValueFrom(this.http.post<BackendLoginResponse>(`${this.apiBase}/users/login`, payload));
      const user = this.mapBackendUser(response, email);
      this._currentUser.set(user);
      sessionStorage.setItem('sw_user', JSON.stringify(user));
      if (response.token) {
        sessionStorage.setItem('sw_token', response.token);
      }
      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login failed', error);
      const err = error as HttpErrorResponse;
      const backendMessage = typeof err.error === 'string'
        ? err.error
        : (err.error?.message ?? err.message ?? '');
      return { success: false, message: backendMessage || 'Login failed. Check credentials or backend availability.' };
    }
  }

  logout(): void {
    this._currentUser.set(null);
    sessionStorage.removeItem('sw_user');
    sessionStorage.removeItem('sw_token');
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this._currentUser()?.role;
    return role != null && roles.includes(role);
  }

  private loadFromStorage(): User | null {
    try {
      const raw = sessionStorage.getItem('sw_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  getDemoAccounts() {
    return DEMO_USERS.map(u => ({ email: u.email, role: u.role, name: u.name }));
  }

  getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('sw_token');
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  async registerEmployee(payload: EmployeeRegistrationRequest): Promise<{ success: boolean; message: string }> {
    try {
      await firstValueFrom(this.http.post(`${this.apiBase}/employees/register`, payload));
      return { success: true, message: 'Registration submitted. Wait for admin approval before login.' };
    } catch (error) {
      console.error('Employee registration failed', error);
      return { success: false, message: 'Registration failed. Please verify details and try again.' };
    }
  }

  private mapBackendUser(raw: BackendLoginResponse, fallbackEmail: string): User {
    const role = this.toUiRole(raw.userRole);
    return {
      userId: String(raw.userId ?? ''),
      name: raw.userName ?? fallbackEmail.split('@')[0],
      role,
      email: raw.userEmail ?? fallbackEmail,
      phone: raw.userContact ?? '',
      status: (raw.userStatus?.toUpperCase() === 'INACTIVE' ? 'Inactive' : 'Active'),
      department: '',
    };
  }

  private toUiRole(role?: string): UserRole {
    switch ((role ?? '').toUpperCase()) {
      case 'ADMIN':
        return 'Administrator';
      case 'COMPLIANCE_OFFICER':
        return 'Compliance Officer';
      case 'SAFETY_OFFICER':
        return 'Safety Officer';
      case 'EMPLOYEE':
        return 'Employee';
      case 'HAZARD_OFFICER':
        return 'Hazard Officer';
      default:
        return 'Employee';
    }
  }
}

interface BackendLoginResponse {
  userId?: number;
  userName?: string;
  userEmail?: string;
  userContact?: string;
  userStatus?: string;
  userRole?: string;
  token?: string;
}

export interface EmployeeRegistrationRequest {
  userName: string;
  userEmail: string;
  userContact: string;
  password: string;
  employeeDOB: string;
  employeeGender: string;
  employeeAddress: string;
  employeeDepartmentName: string;
  employeeDocumentType: string;
  employeeFileURL: string;
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface EmployeeRequest {
  userName: string;
  userEmail: string;
  userContact?: string;
  userStatus?: string;
  password?: string;
  userRole?: string;
  employeeDOB?: string;
  employeeGender?: string;
  employeeAddress?: string;
  employeeDepartmentName: string;
  employeeDocumentType?: string;
  employeeFileURL?: string;
  verificationStatus?: string;
}

export interface EmployeeResponseDTO {
  employeeId: number;
  employeeName: string;
  email: string;
  employeeDepartmentName: string;
  employeeStatus: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/employees';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllEmployees(): Promise<EmployeeResponseDTO[]> {
    return firstValueFrom(this.http.get<EmployeeResponseDTO[]>(`${this.apiUrl}/getall`, this.headers));
  }

  async getEmployeeById(employeeId: number): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/${employeeId}`, this.headers));
  }

  async registerEmployee(dto: EmployeeRequest): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/register`, dto, this.headers));
  }

  async updateEmployee(employeeId: number, dto: EmployeeRequest): Promise<any> {
    return firstValueFrom(this.http.put(`${this.apiUrl}/update/${employeeId}`, dto, this.headers));
  }

  async approveEmployee(employeeId: number): Promise<any> {
    return firstValueFrom(this.http.patch(`${this.apiUrl}/approve/${employeeId}`, {}, this.headers));
  }
}

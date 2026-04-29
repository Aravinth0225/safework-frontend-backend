import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ComplianceRecordService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/complianceRecord';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllComplianceRecords(): Promise<any[]> {
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/getAllComplianceRecord`, this.headers));
  }

  async getComplianceRecordById(complianceId: number): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/getComplianceRecordById/${complianceId}`, this.headers));
  }

  async createComplianceRecord(dto: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.apiUrl}/createComplianceRecord`, dto, { ...this.headers, responseType: 'text' as 'json' }));
  }

  async updateComplianceRecord(complianceId: number, dto: any): Promise<any> {
    return firstValueFrom(this.http.put<any>(`${this.apiUrl}/updateComplianceRecord/${complianceId}`, dto, { ...this.headers, responseType: 'text' as 'json' }));
  }

  async deleteComplianceRecord(complianceId: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/deleteComplianceRecord/${complianceId}`, { ...this.headers, responseType: 'text' as 'json' }));
  }
}

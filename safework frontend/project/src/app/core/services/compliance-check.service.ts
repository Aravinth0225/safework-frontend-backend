import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface ComplianceRequestDTO {
  complianceCheckResult: string;
  complianceCheckNotes: string;
  complianceCheckDate: string;
  complianceCheckStatus: string;
  inspectionId: number;
}

export interface ComplianceResponseDTO {
  checkId: number;
  complianceCheckResult: string;
  complianceCheckNotes: string;
  complianceCheckDate: string;
  complianceCheckStatus: string;
  inspectionId: number;
}

@Injectable({ providedIn: 'root' })
export class ComplianceCheckService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/compliance-checks';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllChecks(): Promise<ComplianceResponseDTO[]> {
    return firstValueFrom(this.http.get<ComplianceResponseDTO[]>(`${this.apiUrl}/getAllChecks`, this.headers));
  }

  async getChecksByInspectionId(inspectionId: number): Promise<ComplianceResponseDTO[]> {
    return firstValueFrom(this.http.get<ComplianceResponseDTO[]>(`${this.apiUrl}/getChecksByInspectionId/${inspectionId}`, this.headers));
  }

  async createCheck(dto: ComplianceRequestDTO): Promise<ComplianceResponseDTO> {
    return firstValueFrom(this.http.post<ComplianceResponseDTO>(`${this.apiUrl}/createCheck`, dto, this.headers));
  }

  async updateCheck(checkId: number, dto: ComplianceRequestDTO): Promise<ComplianceResponseDTO> {
    return firstValueFrom(this.http.put<ComplianceResponseDTO>(`${this.apiUrl}/updateCheck/${checkId}`, dto, this.headers));
  }

  async deleteCheck(checkId: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/deleteCheck/${checkId}`, { ...this.headers, responseType: 'text' }));
  }
}

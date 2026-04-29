import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface AuditRequestDto {
  auditTitle: string;
  auditDescription: string;
  auditScope: string;
  auditStatus: string;
}

export interface AuditResponseDto {
  auditId: number;
  auditTitle: string;
  auditDescription: string;
  auditScope: string;
  auditStatus: string;
  officerId: number;
  officerName: string; // the backend uses a projection, so let's verify what it returns exactly, but this is the likely structure.
  auditDate: string; // The model uses audit.date? The backend entity is Audit. Wait, the user payload didn't specify auditDate. Let's see what the backend expects.
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/audit';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllAudits(): Promise<any[]> {
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/getAll`, this.headers));
  }

  async getAuditById(auditId: number): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/getAuditById/${auditId}`, this.headers));
  }

  async createAudit(dto: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.apiUrl}/createAudit`, dto, { ...this.headers, responseType: 'text' as 'json' }));
  }

  async updateAudit(auditId: number, dto: any): Promise<any> {
    return firstValueFrom(this.http.put<any>(`${this.apiUrl}/updateAudit/${auditId}`, dto, this.headers));
  }

  async deleteAudit(auditId: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/deleteAudit/${auditId}`, { ...this.headers, responseType: 'text' as 'json' }));
  }
}

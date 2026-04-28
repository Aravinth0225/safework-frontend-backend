import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Hazard } from '../models';
import { AuthService } from './auth.service';

export interface HazardRequestDto {
  hazardId?: number;
  employeeId: number;
  hazardDescription: string;
  hazardLocation: string;
  hazardStatus: string;
}

export interface HazardReportProjection {
  hazardId: number;
  hazardDescription: string;
  hazardLocation: string;
  hazardDate: string;
  hazardStatus: string;
  employeeId: number;
}

@Injectable({ providedIn: 'root' })
export class HazardService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/hazard';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllHazards(): Promise<HazardReportProjection[]> {
    return firstValueFrom(this.http.get<HazardReportProjection[]>(`${this.apiUrl}/getAllHazard`, this.headers));
  }

  async getHazardsByEmployee(employeeId: number): Promise<HazardReportProjection[]> {
    return firstValueFrom(this.http.get<HazardReportProjection[]>(`${this.apiUrl}/employee/${employeeId}`, this.headers));
  }

  async addHazard(dto: HazardRequestDto): Promise<HazardRequestDto> {
    return firstValueFrom(this.http.post<HazardRequestDto>(`${this.apiUrl}/postHazard`, dto, this.headers));
  }

  async updateHazard(hazardId: number, dto: HazardRequestDto): Promise<HazardRequestDto> {
    return firstValueFrom(this.http.put<HazardRequestDto>(`${this.apiUrl}/update/${hazardId}`, dto, this.headers));
  }

  async deleteHazard(hazardId: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/${hazardId}`, { ...this.headers, responseType: 'text' }));
  }
}

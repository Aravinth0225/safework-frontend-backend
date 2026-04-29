import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface IncidentRequestDto {
  actions: string;
  status: string;
}

export interface IncidentReportProjection {
  incidentId: number;
  hazardId: number;
  hazardDescription: string;
  officerId: number;
  officerName: string;
  actions: string;
  date: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/incidents';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllIncidents(): Promise<IncidentReportProjection[]> {
    return firstValueFrom(this.http.get<IncidentReportProjection[]>(`${this.apiUrl}/getAllIncidents`, this.headers));
  }

  async getIncidentById(incidentId: number): Promise<IncidentReportProjection> {
    return firstValueFrom(this.http.get<IncidentReportProjection>(`${this.apiUrl}/${incidentId}`, this.headers));
  }

  async getIncidentsByOfficer(officerId: number): Promise<IncidentReportProjection[]> {
    return firstValueFrom(this.http.get<IncidentReportProjection[]>(`${this.apiUrl}/officer/${officerId}`, this.headers));
  }

  async addIncident(hazardId: number, dto: IncidentRequestDto): Promise<IncidentRequestDto> {
    return firstValueFrom(this.http.post<IncidentRequestDto>(`${this.apiUrl}/${hazardId}`, dto, this.headers));
  }
}

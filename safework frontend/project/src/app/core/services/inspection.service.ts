import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface InspectionRequestDTO {
  inspectionLocation: string;
  inspectionFindings: string;
  inspectionDate: string;
  inspectionStatus: string;
  officerId: number;
}

export interface InspectionResponseDTO {
  inspectionId: number;
  inspectionLocation: string;
  inspectionFindings: string;
  inspectionDate: string;
  inspectionStatus: string;
  officerId: number;
}

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/inspections';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllInspections(): Promise<InspectionResponseDTO[]> {
    return firstValueFrom(this.http.get<InspectionResponseDTO[]>(`${this.apiUrl}/getallInspection`, this.headers));
  }

  async getInspectionById(id: number): Promise<InspectionResponseDTO> {
    return firstValueFrom(this.http.get<InspectionResponseDTO>(`${this.apiUrl}/getbyInspectionId/${id}`, this.headers));
  }

  async createInspection(dto: InspectionRequestDTO): Promise<InspectionResponseDTO> {
    return firstValueFrom(this.http.post<InspectionResponseDTO>(`${this.apiUrl}/createInspection`, dto, this.headers));
  }

  async updateInspection(id: number, dto: InspectionRequestDTO): Promise<InspectionResponseDTO> {
    return firstValueFrom(this.http.put<InspectionResponseDTO>(`${this.apiUrl}/update/${id}`, dto, this.headers));
  }

  async deleteInspection(id: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/deleteInspection/${id}`, { ...this.headers, responseType: 'text' }));
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface Program {
  programId: number;
  programTitle: string;
  programDescription: string;
  programStartDate: string;
  programEndDate: string;
  programStatus: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/programs';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllPrograms(): Promise<Program[]> {
    return firstValueFrom(this.http.get<Program[]>(`${this.apiUrl}/getallprograms`, this.headers));
  }
}

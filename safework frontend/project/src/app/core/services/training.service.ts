import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface Training {
  id?: number;
  trainingCompletionDate?: string;
  trainingStatus: string;
  programId: number;
  employeeId: number;
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/trainings';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllTrainings(): Promise<Training[]> {
    return firstValueFrom(this.http.get<Training[]>(`${this.apiUrl}/getalltrainings`, this.headers));
  }

  async getTrainingsByEmployee(employeeId: number): Promise<Training[]> {
    return firstValueFrom(this.http.get<Training[]>(`${this.apiUrl}/mytrainings/${employeeId}`, this.headers));
  }

  async createTraining(training: Training): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/createtraining`, training, this.headers));
  }

  async updateTraining(trainingId: number, training: Training): Promise<any> {
    return firstValueFrom(this.http.put(`${this.apiUrl}/updatetrainingbyid/${trainingId}`, training, this.headers));
  }

  async deleteTraining(trainingId: number): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/deletetrainingbyid/${trainingId}`, this.headers));
  }
}

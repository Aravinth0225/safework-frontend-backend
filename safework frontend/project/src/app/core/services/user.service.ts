import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface UserPublicDTO {
  userId: number;
  userName: string;
  userEmail: string;
  userContact: string;
  userStatus: string;
  userRole: string;
}

export interface UserUpdateDTO {
  userName?: string;
  userEmail?: string;
  userContact?: string;
  userStatus?: string;
  userRole?: string;
  password?: string;
}

export interface UserRegistrationDTO extends UserUpdateDTO {
  userName: string;
  userEmail: string;
  userRole: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8099/users';

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  async getAllUsers(): Promise<UserPublicDTO[]> {
    return firstValueFrom(this.http.get<UserPublicDTO[]>(`${this.apiUrl}/getAllUsers`, this.headers));
  }

  async getUserById(userId: number): Promise<UserPublicDTO> {
    return firstValueFrom(this.http.get<UserPublicDTO>(`${this.apiUrl}/getUserById/${userId}`, this.headers));
  }

  async registerUser(dto: UserRegistrationDTO): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/register`, dto, this.headers));
  }

  async updateUser(userId: number, dto: UserUpdateDTO): Promise<UserPublicDTO> {
    return firstValueFrom(this.http.patch<UserPublicDTO>(`${this.apiUrl}/updateUser/${userId}`, dto, this.headers));
  }

  async deleteUser(userId: number): Promise<string> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/delete/${userId}`, { ...this.headers, responseType: 'text' }));
  }
}

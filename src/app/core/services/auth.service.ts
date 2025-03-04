import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterProviderRequest,
  RegisterUserRequest,
  User
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify({
            id: response.id,
            username: response.username,
            email: response.email,
            rol: response.rol,
            nombre: '', // Estos valores no vienen en la respuesta del login
            apellido: '',
            estado: true
          }));

          this.currentUserSubject.next({
            id: response.id,
            username: response.username,
            email: response.email,
            rol: response.rol as any,
            nombre: '',
            apellido: '',
            estado: true
          });
        })
      );
  }

  registerProvider(providerData: RegisterProviderRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/registro-proveedor`, providerData, { responseType: 'text' });
  }

  registerUser(userData: RegisterUserRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/registro-usuario`, userData, { responseType: 'text' });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUserRole(): string | null {
    const user = this.currentUserSubject.getValue();
    return user ? user.rol : null;
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
        this.logout(); // Si hay error al parsear, mejor limpiar
      }
    }
  }
}

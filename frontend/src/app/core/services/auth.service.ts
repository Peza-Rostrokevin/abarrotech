import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'catalogo_token';
  private readonly USER_KEY = 'catalogo_user';

  readonly currentUser = signal<User | null>(this.getStoredUser());

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((user) => this.saveSession(user))
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, data).pipe(
      tap((user) => this.saveSession(user))
    );
  }

  updateProfile(data: { name: string; email: string; phone: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/auth/profile`, data).pipe(
      tap((user) => this.updateStoredUser(user))
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/auth/password`, data);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.token && !!this.currentUser();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  isVendedor(): boolean {
    return this.currentUser()?.role === 'vendedor';
  }

  private saveSession(user: User): void {
    localStorage.setItem(this.TOKEN_KEY, user.token ?? '');
    const { token: _token, ...safeUser } = user;
    localStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
    this.currentUser.set(safeUser);
  }

  private updateStoredUser(user: User): void {
    const current = this.currentUser();
    const updated = { ...current, ...user };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}

import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

const TOKEN_KEY = 'TrainTicket_token';
const NAME_KEY = 'TrainTicket_name';
const EMAIL_KEY = 'TrainTicket_email';

@Injectable({ providedIn: 'root' })
export class AuthService {

  fullName = signal<string | null>(null);
  email = signal<string | null>(null);

  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      this.fullName.set(localStorage.getItem(NAME_KEY));
      this.email.set(localStorage.getItem(EMAIL_KEY));
    }
  }

  get token(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  register(
    request: RegisterRequest
  ): Observable<{ userId: number; message: string }> {
    return this.http.post<{ userId: number; message: string }>(
      `${environment.apiUrl}/auth/register`,
      request
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/login`,
        request
      )
      .pipe(
        tap((res) => {
          if (!this.isBrowser) {
            return;
          }

          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(NAME_KEY, res.fullName);
          localStorage.setItem(EMAIL_KEY, res.email);

          this.fullName.set(res.fullName);
          this.email.set(res.email);
        })
      );
  }

  logout(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(EMAIL_KEY);

    this.fullName.set(null);
    this.email.set(null);
  }
}
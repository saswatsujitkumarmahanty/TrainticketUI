import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { BookingCreatedResult, BookingDetails, BookingSummary, CreateBookingRequest } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) {}

  create(request: CreateBookingRequest): Observable<BookingCreatedResult> {
    return this.http.post<BookingCreatedResult>(`${environment.apiUrl}/bookings`, request);
  }

  getMine(): Observable<BookingSummary[]> {
    return this.http.get<BookingSummary[]>(`${environment.apiUrl}/bookings`);
  }

  getByPnr(pnr: string): Observable<BookingDetails> {
    return this.http.get<BookingDetails>(`${environment.apiUrl}/bookings/${pnr}`);
  }

  cancel(pnr: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/bookings/${pnr}/cancel`, {});
  }
}

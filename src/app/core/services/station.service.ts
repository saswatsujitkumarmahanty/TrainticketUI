import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Station } from '../models/station.model';
 
@Injectable({ providedIn: 'root' })
export class StationService {
  constructor(private http: HttpClient) {}
 
  search(term: string): Observable<Station[]> {
    const params = new HttpParams().set('term', term);
    return this.http.get<Station[]>(`${environment.apiUrl}/stations/search`, { params });
  }
 
  getById(id: number): Observable<Station> {
    return this.http.get<Station>(`${environment.apiUrl}/stations/${id}`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { TrainSearchResult } from '../models/train.model';
 
@Injectable({ providedIn: 'root' })
export class TrainService {
  constructor(private http: HttpClient) {}
 
  search(fromStationId: number, toStationId: number, journeyDate: string): Observable<TrainSearchResult[]> {
    const params = new HttpParams()
      .set('from', fromStationId)
      .set('to', toStationId)
      .set('date', journeyDate); 
    return this.http.get<TrainSearchResult[]>(`${environment.apiUrl}/trains/search`, { params });
  }
}
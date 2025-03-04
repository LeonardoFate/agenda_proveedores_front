// src/app/core/services/area.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Area } from '../models/area.model';
import { Anden } from '../models/anden.model';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private areaApiUrl = `${environment.apiUrl}/api/areas`;
  private andenApiUrl = `${environment.apiUrl}/api/andenes`;

  constructor(private http: HttpClient) {}

  // Áreas
  getAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(this.areaApiUrl);
  }

  getAreaById(id: number): Observable<Area> {
    return this.http.get<Area>(`${this.areaApiUrl}/${id}`);
  }

  createArea(area: Area): Observable<Area> {
    return this.http.post<Area>(this.areaApiUrl, area);
  }

  updateArea(id: number, area: Area): Observable<Area> {
    return this.http.put<Area>(`${this.areaApiUrl}/${id}`, area);
  }

  deleteArea(id: number): Observable<void> {
    return this.http.delete<void>(`${this.areaApiUrl}/${id}`);
  }

  // Andenes
  getAndenes(): Observable<Anden[]> {
    return this.http.get<Anden[]>(this.andenApiUrl);
  }

  getAndenById(id: number): Observable<Anden> {
    return this.http.get<Anden>(`${this.andenApiUrl}/${id}`);
  }

  getAndenesByArea(areaId: number): Observable<Anden[]> {
    return this.http.get<Anden[]>(`${this.andenApiUrl}/area/${areaId}`);
  }

  createAnden(anden: Anden): Observable<Anden> {
    return this.http.post<Anden>(this.andenApiUrl, anden);
  }

  updateAnden(id: number, anden: Anden): Observable<Anden> {
    return this.http.put<Anden>(`${this.andenApiUrl}/${id}`, anden);
  }

  updateAndenStatus(id: number, estado: string): Observable<Anden> {
    return this.http.patch<Anden>(`${this.andenApiUrl}/${id}/estado?estado=${estado}`, {});
  }

  deleteAnden(id: number): Observable<void> {
    return this.http.delete<void>(`${this.andenApiUrl}/${id}`);
  }
}

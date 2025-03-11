// src/app/core/services/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReservationStat {
  date: string;
  total: number;
  completed: number;
  canceled: number;
  pending: number;
}

export interface AreaStat {
  areaName: string;
  total: number;
  percentage: number;
}

export interface ProviderStat {
  providerName: string;
  reservationsCount: number;
  completedPercentage: number;
  averageTimeInMinutes: number;
}

export interface EfficiencyStat {
  andenNumber: number;
  areaName: string;
  utilizationPercentage: number;
  averageTimePerReservation: number;
  reservationsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) {}

  // Obtener estadísticas de reservas por fecha
  getReservationStats(startDate: string, endDate: string): Observable<ReservationStat[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ReservationStat[]>(`${this.apiUrl}/reservations`, { params });
  }

  // Obtener estadísticas por área
  getAreaStats(startDate: string, endDate: string): Observable<AreaStat[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<AreaStat[]>(`${this.apiUrl}/areas`, { params });
  }

  // Obtener estadísticas de eficiencia de andenes
  getEfficiencyStats(startDate: string, endDate: string): Observable<EfficiencyStat[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<EfficiencyStat[]>(`${this.apiUrl}/efficiency`, { params });
  }

  // Obtener estadísticas de proveedores
  getProviderStats(startDate: string, endDate: string): Observable<ProviderStat[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ProviderStat[]>(`${this.apiUrl}/providers`, { params });
  }

  // Exportar reporte a PDF o Excel
  exportReport(reportType: string, format: 'pdf' | 'excel', startDate: string, endDate: string): Observable<any> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('format', format);

    return this.http.get(`${this.apiUrl}/${reportType}/export`, {
      params,
      responseType: 'blob'
    });
  }
}

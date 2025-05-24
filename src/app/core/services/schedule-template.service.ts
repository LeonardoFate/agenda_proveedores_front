// src/app/core/services/schedule-template.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HorarioPlantilla {
  id: number;
  areaId: number;
  diaSemana: string; // 'LUNES', 'MARTES', etc.
  horaInicio: string;
  horaFin: string;
  creadorId: number;
  esActivo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleTemplateService {
  private apiUrl = `${environment.apiUrl}/horarios-plantilla`;

  constructor(private http: HttpClient) {}

  getHorariosPlantilla(areaId: number): Observable<HorarioPlantilla[]> {
    return this.http.get<HorarioPlantilla[]>(`${this.apiUrl}/area/${areaId}`);
  }

  getHorarioDisponible(fecha: string, areaId: number): Observable<{horaInicio: string, horaFin: string}[]> {
    return this.http.get<{horaInicio: string, horaFin: string}[]>(`${this.apiUrl}/disponibilidad/${fecha}/${areaId}`);
  }

  // Solo para supervisores y jefes
  crearHorarioPlantilla(plantilla: HorarioPlantilla): Observable<HorarioPlantilla> {
    return this.http.post<HorarioPlantilla>(this.apiUrl, plantilla);
  }

  actualizarHorarioPlantilla(id: number, plantilla: HorarioPlantilla): Observable<HorarioPlantilla> {
    return this.http.put<HorarioPlantilla>(`${this.apiUrl}/${id}`, plantilla);
  }

  eliminarHorarioPlantilla(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  // En: src/app/core/services/schedule-template.service.ts
// Agregar este método:

cargarDesdeExcel(archivo: File): Observable<any> {
  const formData = new FormData();
  formData.append('archivo', archivo);

  return this.http.post<any>(
    `${this.apiUrl}/upload-excel`,
    formData
  );
}
}

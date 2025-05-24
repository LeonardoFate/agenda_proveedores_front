import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PlantillaHorario,
  DiaSemana,
  ExcelUploadResponse,
  TemplateStatistics
} from '../models/plantilla-horario.model';

@Injectable({
  providedIn: 'root'
})
export class PlantillaHorarioService {
  private apiUrl = `${environment.apiUrl}/api/admin/plantillas`;

  constructor(private http: HttpClient) {}

  // ===== MÉTODOS PARA ADMINISTRADORES =====

  // Subir plantilla Excel
  uploadExcelTemplate(file: File): Observable<ExcelUploadResponse> {
    const formData = new FormData();
    formData.append('archivo', file);

    return this.http.post<ExcelUploadResponse>(`${this.apiUrl}/upload-excel`, formData)
      .pipe(
        tap(response => console.log('Plantilla cargada exitosamente:', response)),
        catchError(error => {
          console.error('Error al cargar plantilla Excel:', error);
          throw error;
        })
      );
  }

  // Obtener plantilla completa de la semana
  getWeekTemplate(): Observable<PlantillaHorario[]> {
    return this.http.get<PlantillaHorario[]>(`${this.apiUrl}/semana`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener plantilla de la semana:', error);
          throw error;
        })
      );
  }

  // Obtener plantilla por día específico
  getTemplateByDay(dia: DiaSemana): Observable<PlantillaHorario[]> {
    return this.http.get<PlantillaHorario[]>(`${this.apiUrl}/dia/${dia}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener plantilla del día:', error);
          throw error;
        })
      );
  }

  // Crear horario individual
  createSchedule(plantilla: PlantillaHorario): Observable<PlantillaHorario> {
    return this.http.post<PlantillaHorario>(this.apiUrl, plantilla)
      .pipe(
        catchError(error => {
          console.error('Error al crear horario:', error);
          throw error;
        })
      );
  }

  // Actualizar horario individual
  updateSchedule(id: number, plantilla: PlantillaHorario): Observable<PlantillaHorario> {
    return this.http.put<PlantillaHorario>(`${this.apiUrl}/${id}`, plantilla)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar horario:', error);
          throw error;
        })
      );
  }

  // Eliminar horario
  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error al eliminar horario:', error);
          throw error;
        })
      );
  }

  // Obtener estadísticas de plantillas
  getTemplateStatistics(): Observable<TemplateStatistics> {
    return this.http.get<TemplateStatistics>(`${this.apiUrl}/estadisticas`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener estadísticas:', error);
          throw error;
        })
      );
  }
}

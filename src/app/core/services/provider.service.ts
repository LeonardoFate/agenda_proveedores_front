import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Reserva, ReservaDetalle } from '../../core/models/reserva.model';
import { HorarioProveedor } from '../models/horario-proveedor.model';

export interface ProviderStatistics {
  totalReservas: number;
  completadas: number;
  canceladas: number;
  pendientesConfirmacion: number;
  confirmadas: number;
  distribucionPorEstado: { [key: string]: number };
  periodoConsultado: {
    fechaInicio: string;
    fechaFin: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private reservasUrl = `${environment.apiUrl}/api/reservas`;
  private areasUrl = `${environment.apiUrl}/api/areas`;
  private tiposServicioUrl = `${environment.apiUrl}/api/tipos-servicio`;
  private andenesUrl = `${environment.apiUrl}/api/andenes`;
  private documentosUrl = `${environment.apiUrl}/api/documentos`;
  private proveedoresUrl = `${environment.apiUrl}/api/proveedores`;
  private plantillasUrl = `${environment.apiUrl}/api/admin/plantillas`;

  constructor(private http: HttpClient) {}

  // ===== NUEVOS MÉTODOS PARA PLANTILLAS DE HORARIOS =====

  // Obtener horario asignado para una fecha específica
  getMySchedule(fecha: string): Observable<HorarioProveedor> {
    const params = new HttpParams().set('fecha', fecha);

    return this.http.get<HorarioProveedor>(`${this.reservasUrl}/mi-horario`, { params })
      .pipe(
        tap(horario => console.log('Horario obtenido:', horario)),
        catchError(error => {
          console.error('Error al obtener horario:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener horarios de la semana completa
  getMyWeekSchedule(fechaInicio: string): Observable<HorarioProveedor[]> {
    const params = new HttpParams().set('fechaInicio', fechaInicio);

    return this.http.get<HorarioProveedor[]>(`${this.reservasUrl}/mi-horario-semanal`, { params })
      .pipe(
        tap(horarios => console.log('Horarios semanales obtenidos:', horarios.length)),
        catchError(error => {
          console.error('Error al obtener horarios semanales:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener reserva pendiente de confirmación
  getPendingReservation(fecha: string): Observable<ReservaDetalle> {
    const params = new HttpParams().set('fecha', fecha);

    return this.http.get<ReservaDetalle>(`${this.reservasUrl}/mi-reserva-pendiente`, { params })
      .pipe(
        tap(reserva => console.log('Reserva pendiente obtenida:', reserva)),
        catchError(error => {
          console.error('Error al obtener reserva pendiente:', error);
          return throwError(() => error);
        })
      );
  }

  // Confirmar reserva (completar datos de transporte)
  confirmReservation(reservaData: Reserva): Observable<ReservaDetalle> {
    console.log('Confirmando reserva con datos:', reservaData);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ReservaDetalle>(`${this.reservasUrl}/confirmar`, reservaData, { headers })
      .pipe(
        tap(response => console.log('Reserva confirmada exitosamente:', response)),
        catchError(error => {
          console.error('Error al confirmar reserva:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener mis reservas con filtros opcionales
  getMyReservationsFiltered(fechaInicio?: string, fechaFin?: string): Observable<Reserva[]> {
    let params = new HttpParams();

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<Reserva[]>(`${this.reservasUrl}/mis-reservas`, { params })
      .pipe(
        tap(reservas => console.log('Mis reservas obtenidas:', reservas.length)),
        catchError(error => {
          console.error('Error al obtener mis reservas:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener mis estadísticas
  getMyStatistics(fechaInicio?: string, fechaFin?: string): Observable<ProviderStatistics> {
    let params = new HttpParams();

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<ProviderStatistics>(`${this.reservasUrl}/mis-estadisticas`, { params })
      .pipe(
        tap(stats => console.log('Estadísticas obtenidas:', stats)),
        catchError(error => {
          console.error('Error al obtener estadísticas:', error);
          return throwError(() => error);
        })
      );
  }

  // ===== MÉTODOS EXISTENTES MANTENIDOS =====

  // Reservas del proveedor (método legacy)
  getMyReservations(proveedorId: number): Observable<Reserva[]> {
    console.log('Obteniendo reservas para proveedor ID:', proveedorId);
    return this.http.get<Reserva[]>(`${this.reservasUrl}/proveedor/${proveedorId}`)
      .pipe(
        tap(reservas => console.log('Reservas obtenidas:', reservas.length)),
        catchError(error => {
          console.error('Error al obtener reservas:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener detalles de una reserva
  getReservationById(id: number): Observable<ReservaDetalle> {
    return this.http.get<ReservaDetalle>(`${this.reservasUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener detalles de reserva:', error);
          return throwError(() => error);
        })
      );
  }

  // Crear una nueva reserva (solo para admin ahora)
  createReservation(reservation: Reserva): Observable<ReservaDetalle> {
    console.log('URL de creación de reservas:', this.reservasUrl);
    console.log('Datos de la reserva a crear:', JSON.stringify(reservation));

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ReservaDetalle>(this.reservasUrl, reservation, { headers })
      .pipe(
        tap(response => console.log('Respuesta del servidor:', response)),
        catchError(error => {
          console.error('Error completo al crear reserva:', error);
          return throwError(() => error);
        })
      );
  }

  // Actualizar una reserva existente
  updateReservation(id: number, reservation: Reserva): Observable<ReservaDetalle> {
    console.log('Actualizando reserva ID:', id);
    console.log('Datos para actualizar:', JSON.stringify(reservation));

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<ReservaDetalle>(`${this.reservasUrl}/${id}`, reservation, { headers })
      .pipe(
        catchError(error => {
          console.error('Error al actualizar reserva:', error);
          return throwError(() => error);
        })
      );
  }

  // Cancelar una reserva
  cancelReservation(id: number): Observable<void> {
    return this.http.post<void>(`${this.reservasUrl}/${id}/cancelar`, {})
      .pipe(
        catchError(error => {
          console.error('Error al cancelar reserva:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener áreas disponibles
  getAreas(): Observable<any[]> {
    return this.http.get<any[]>(this.areasUrl)
      .pipe(
        catchError(error => {
          console.error('Error al obtener áreas:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener tipos de servicio
  getTiposServicio(): Observable<any[]> {
    return this.http.get<any[]>(this.tiposServicioUrl)
      .pipe(
        catchError(error => {
          console.error('Error al obtener tipos de servicio:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener andenes por área
  getAndenesByArea(areaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.andenesUrl}/area/${areaId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener andenes por área:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener información del proveedor por ID de usuario
  getProviderByUsuarioId(usuarioId: number): Observable<any> {
    console.log('Obteniendo proveedor para usuario ID:', usuarioId);
    return this.http.get<any>(`${this.proveedoresUrl}/usuario/${usuarioId}`)
      .pipe(
        tap(proveedor => console.log('Proveedor obtenido:', proveedor)),
        catchError(error => {
          console.error('Error al obtener proveedor por ID de usuario:', error);
          return throwError(() => error);
        })
      );
  }

  // Actualizar información del proveedor
  updateProviderInfo(proveedorId: number, providerData: any): Observable<any> {
    return this.http.put<any>(`${this.proveedoresUrl}/${proveedorId}`, providerData)
      .pipe(
        catchError(error => {
          console.error('Error al actualizar información del proveedor:', error);
          return throwError(() => error);
        })
      );
  }

  // Subir documento
  uploadDocument(reservaId: number, file: File, descripcion?: string): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('reservaId', reservaId.toString());

    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    return this.http.post<any>(`${this.documentosUrl}/subir`, formData)
      .pipe(
        catchError(error => {
          console.error('Error al subir documento:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener documentos por reserva
  getDocumentsByReservation(reservaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.documentosUrl}/reserva/${reservaId}`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener documentos por reserva:', error);
          return throwError(() => error);
        })
      );
  }

  // Descargar documento
  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.documentosUrl}/${documentId}/descargar`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error al descargar documento:', error);
        return throwError(() => error);
      })
    );
  }

  // Eliminar documento
  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.documentosUrl}/${documentId}`)
      .pipe(
        catchError(error => {
          console.error('Error al eliminar documento:', error);
          return throwError(() => error);
        })
      );
  }

  // ===== MÉTODOS PARA PROVEEDORES =====

  // Obtener todos los proveedores
  getProveedores(): Observable<any[]> {
    return this.http.get<any[]>(this.proveedoresUrl)
      .pipe(
        tap(proveedores => console.log('Proveedores obtenidos:', proveedores.length)),
        catchError(error => {
          console.error('Error al obtener proveedores:', error);
          return throwError(() => error);
        })
      );
  }

  // ===== MÉTODOS PARA PLANTILLAS DE HORARIO =====

  // Subir Excel de plantillas
  uploadPlantillaExcel(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    return this.http.post<any>(`${this.plantillasUrl}/upload-excel`, formData)
      .pipe(
        tap(response => console.log('Excel procesado:', response)),
        catchError(error => {
          console.error('Error al procesar Excel:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener todas las plantillas
  getPlantillasHorario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.plantillasUrl}/semana`)
      .pipe(
        tap(plantillas => console.log('Plantillas obtenidas:', plantillas.length)),
        catchError(error => {
          console.error('Error al obtener plantillas:', error);
          return throwError(() => error);
        })
      );
  }

  // Crear plantilla individual
  createPlantillaHorario(plantilla: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(this.plantillasUrl, plantilla, { headers })
      .pipe(
        tap(response => console.log('Plantilla creada:', response)),
        catchError(error => {
          console.error('Error al crear plantilla:', error);
          return throwError(() => error);
        })
      );
  }

  // Actualizar plantilla
  updatePlantillaHorario(id: number, plantilla: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<any>(`${this.plantillasUrl}/${id}`, plantilla, { headers })
      .pipe(
        tap(response => console.log('Plantilla actualizada:', response)),
        catchError(error => {
          console.error('Error al actualizar plantilla:', error);
          return throwError(() => error);
        })
      );
  }

  // Eliminar plantilla
  deletePlantillaHorario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.plantillasUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error al eliminar plantilla:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener estadísticas de plantillas
  getPlantillasEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.plantillasUrl}/estadisticas`)
      .pipe(
        tap(stats => console.log('Estadísticas de plantillas:', stats)),
        catchError(error => {
          console.error('Error al obtener estadísticas de plantillas:', error);
          return throwError(() => error);
        })
      );
  }
}

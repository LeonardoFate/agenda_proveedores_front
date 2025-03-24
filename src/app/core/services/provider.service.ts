import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Reserva, ReservaDetalle, DisponibilidadAnden } from '../../core/models/reserva.model';

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

  constructor(private http: HttpClient) {}

  // Reservas del proveedor
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

  // Crear una nueva reserva con mejor manejo de errores
  createReservation(reservation: Reserva): Observable<ReservaDetalle> {
    console.log('URL de creación de reservas:', this.reservasUrl);
    console.log('Datos de la reserva a crear:', JSON.stringify(reservation));

    // Agregar el Content-Type correcto
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ReservaDetalle>(this.reservasUrl, reservation, { headers })
      .pipe(
        tap(response => console.log('Respuesta del servidor:', response)),
        catchError(error => {
          console.error('Error completo al crear reserva:', error);

          // Información más detallada según el tipo de error
          if (error.status === 404) {
            console.error('Endpoint no encontrado. Verifique la URL:', this.reservasUrl);
          } else if (error.status === 400) {
            console.error('Error en el formato de datos:', error.error);
          }

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

  // Verificar disponibilidad de andenes
  checkAvailability(fecha: string, areaId: number, tipoServicioId?: number): Observable<DisponibilidadAnden[]> {
    let params = new HttpParams()
      .set('fecha', fecha)
      .set('areaId', areaId.toString());

    if (tipoServicioId) {
      params = params.set('tipoServicioId', tipoServicioId.toString());
    }

    console.log('Verificando disponibilidad con params:', { fecha, areaId, tipoServicioId });

    return this.http.get<DisponibilidadAnden[]>(`${this.reservasUrl}/disponibilidad`, { params })
      .pipe(
        catchError(error => {
          console.error('Error al verificar disponibilidad:', error);
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
}

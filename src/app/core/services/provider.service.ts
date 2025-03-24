// src/app/features/provider/services/provider.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<Reserva[]>(`${this.reservasUrl}/proveedor/${proveedorId}`);
  }

  // Obtener detalles de una reserva
  getReservationById(id: number): Observable<ReservaDetalle> {
    return this.http.get<ReservaDetalle>(`${this.reservasUrl}/${id}`);
  }

  // Crear una nueva reserva
  createReservation(reservation: Reserva): Observable<ReservaDetalle> {
    return this.http.post<ReservaDetalle>(this.reservasUrl, reservation);
  }

  // Actualizar una reserva existente
  updateReservation(id: number, reservation: Reserva): Observable<ReservaDetalle> {
    return this.http.put<ReservaDetalle>(`${this.reservasUrl}/${id}`, reservation);
  }

  // Cancelar una reserva
  cancelReservation(id: number): Observable<void> {
    return this.http.post<void>(`${this.reservasUrl}/${id}/cancelar`, {});
  }

  // Obtener áreas disponibles
  getAreas(): Observable<any[]> {
    return this.http.get<any[]>(this.areasUrl);
  }

  // Obtener tipos de servicio
  getTiposServicio(): Observable<any[]> {
    return this.http.get<any[]>(this.tiposServicioUrl);
  }

  // Obtener andenes por área
  getAndenesByArea(areaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.andenesUrl}/area/${areaId}`);
  }

  // Verificar disponibilidad de andenes
  checkAvailability(fecha: string, areaId: number, tipoServicioId?: number): Observable<DisponibilidadAnden[]> {
    let params = new HttpParams()
      .set('fecha', fecha)
      .set('areaId', areaId.toString());

    if (tipoServicioId) {
      params = params.set('tipoServicioId', tipoServicioId.toString());
    }

    return this.http.get<DisponibilidadAnden[]>(`${this.reservasUrl}/disponibilidad`, { params });
  }

  // Obtener información del proveedor
  getProviderByUsuarioId(usuarioId: number): Observable<any> {
    return this.http.get<any>(`${this.proveedoresUrl}/usuario/${usuarioId}`);
  }

  // Actualizar información del proveedor
  updateProviderInfo(proveedorId: number, providerData: any): Observable<any> {
    return this.http.put<any>(`${this.proveedoresUrl}/${proveedorId}`, providerData);
  }

  // Subir documento
  uploadDocument(reservaId: number, file: File, descripcion?: string): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('reservaId', reservaId.toString());

    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    return this.http.post<any>(`${this.documentosUrl}/subir`, formData);
  }

  // Obtener documentos por reserva
  getDocumentsByReservation(reservaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.documentosUrl}/reserva/${reservaId}`);
  }

  // Descargar documento
  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.documentosUrl}/${documentId}/descargar`, {
      responseType: 'blob'
    });
  }

  // Eliminar documento
  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.documentosUrl}/${documentId}`);
  }
}

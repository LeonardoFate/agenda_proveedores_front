// src/app/features/guard/services/reservation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reserva, ReservaDetalle } from '../../core/models/reserva.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/api/reservas`;
  private registroTiempoUrl = `${environment.apiUrl}/api/registros-tiempo`;

  constructor(private http: HttpClient) {}

  // Obtener todas las reservas
  getAllReservations(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.apiUrl);
  }

  // Obtener reservas por fecha
  getReservationsByDate(date: string): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/fecha/${date}`);
  }

  // Obtener reservas por estado
  getReservationsByStatus(status: string): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/estado/${status}`);
  }

  // Obtener detalles de una reserva
  getReservationById(id: number): Observable<ReservaDetalle> {
    return this.http.get<ReservaDetalle>(`${this.apiUrl}/${id}`);
  }

  // Actualizar estado de una reserva
  updateReservationStatus(id: number, status: string): Observable<ReservaDetalle> {
    return this.http.patch<ReservaDetalle>(`${this.apiUrl}/${id}/estado?estado=${status}`, {});
  }

  // Iniciar un registro de tiempo (ingreso o salida)
  startTimeRecord(reservaId: number, usuarioId: number, tipo: string): Observable<any> {
    const params = new HttpParams()
      .set('reservaId', reservaId.toString())
      .set('usuarioId', usuarioId.toString())
      .set('tipo', tipo);

    return this.http.post<any>(`${this.registroTiempoUrl}/iniciar`, null, { params });
  }

  // Finalizar un registro de tiempo
  finishTimeRecord(registroId: number): Observable<any> {
    return this.http.post<any>(`${this.registroTiempoUrl}/${registroId}/finalizar`, {});
  }

  // Obtener registros de tiempo por reserva
  getTimeRecordsByReservation(reservaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.registroTiempoUrl}/reserva/${reservaId}`);
  }

  // Buscar reservas
  searchReservations(query: string): Observable<Reserva[]> {
    // Implementar la lógica de búsqueda en el frontend
    // ya que el backend no tiene un endpoint específico para búsqueda
    return this.getAllReservations();
  }
}

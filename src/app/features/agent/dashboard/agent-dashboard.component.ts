// src/app/features/agent/dashboard/agent-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { User } from '../../../core/models/user.model';
import { Reserva } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-dashboard.component.html'
})
export class AgentDashboardComponent implements OnInit {
  currentUser: User | null = null;
  todaysReservations: Reserva[] = [];
  loading = true;
  currentDate = new Date();

  stats = {
    pendingReceptions: 0,
    inProgressReceptions: 0,
    completedReceptions: 0,
    totalToday: 0
  };

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadTodaysReservations();
    });
  }

  loadTodaysReservations(): void {
    this.loading = true;
    const today = new Date().toISOString().split('T')[0];

    this.reservationService.getReservationsByDate(today).subscribe({
      next: (data) => {
        this.todaysReservations = data;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando reservas', error);
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.totalToday = this.todaysReservations.length;
    this.stats.pendingReceptions = this.todaysReservations.filter(r => r.estado === 'EN_PLANTA').length;
    this.stats.inProgressReceptions = this.todaysReservations.filter(r => r.estado === 'EN_RECEPCION').length;
    this.stats.completedReceptions = this.todaysReservations.filter(r => r.estado === 'COMPLETADA').length;
  }

  getNextReceptions(): Reserva[] {
    // Obtener las próximas 3 reservas en estado EN_PLANTA
    return this.todaysReservations
      .filter(r => r.estado === 'EN_PLANTA')
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      .slice(0, 3);
  }

  getCurrentReceptions(): Reserva[] {
    // Obtener las reservas actuales en recepción
    return this.todaysReservations
      .filter(r => r.estado === 'EN_RECEPCION')
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      .slice(0, 3);
  }

  // Método para formatear horas (de HH:MM:SS a HH:MM)
  formatTime(timeString: string): string {
    return timeString.substring(0, 5);
  }

  // Método para formatear fechas
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  // Método para obtener una clase de color basada en el estado de la reserva
  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'EN_PLANTA': return 'bg-blue-100 text-blue-800';
      case 'EN_RECEPCION': return 'bg-purple-100 text-purple-800';
      case 'COMPLETADA': return 'bg-green-100 text-green-800';
      case 'CANCELADA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Método para traducir los estados
  getStatusName(status: string): string {
    switch (status) {
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PLANTA': return 'En Planta';
      case 'EN_RECEPCION': return 'En Recepción';
      case 'COMPLETADA': return 'Completada';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  }
}

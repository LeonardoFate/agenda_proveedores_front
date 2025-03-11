// src/app/features/provider/dashboard/provider-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { User } from '../../core/models/user.model';
import { Reserva } from '../../core/models/reserva.model';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './provider-dashboard.component.html',
})
export class ProviderDashboardComponent implements OnInit {
  currentUser: User | null = null;
  providerInfo: any = null;
  loading = true;
  reservations: Reserva[] = [];
  currentDate = new Date();

  stats = {
    pendingReservations: 0,
    completedReservations: 0,
    inProgressReservations: 0,
    canceledReservations: 0,
    totalReservations: 0,
    upcomingReservations: 0
  };

  constructor(
    private authService: AuthService,
    private providerService: ProviderService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadProviderInfo();
        this.loadReservations();
      } else {
        this.loading = false;
      }
    });
  }

  loadProviderInfo(): void {
    if (!this.currentUser) return;

    // Aquí deberíamos tener un endpoint para obtener la info del proveedor a partir del usuario
    // Como asumimos que no existe, usaremos una asociación directa entre usuario y proveedor
    // En una implementación real, esto vendría del backend

    const proveedorId = this.currentUser.id; // Asumimos mismo ID

    this.providerService.getProviderInfo(proveedorId).subscribe({
      next: (data) => {
        this.providerInfo = data;
      },
      error: (error) => {
        console.error('Error loading provider info', error);
      }
    });
  }

  loadReservations(): void {
    if (!this.currentUser) return;

    const proveedorId = this.currentUser.id; // Asumimos mismo ID

    this.providerService.getMyReservations(proveedorId).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reservations', error);
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.stats.totalReservations = this.reservations.length;
    this.stats.pendingReservations = this.reservations.filter(r => r.estado === 'PENDIENTE').length;
    this.stats.completedReservations = this.reservations.filter(r => r.estado === 'COMPLETADA').length;
    this.stats.inProgressReservations = this.reservations.filter(r =>
      r.estado === 'EN_PLANTA' || r.estado === 'EN_RECEPCION'
    ).length;
    this.stats.canceledReservations = this.reservations.filter(r => r.estado === 'CANCELADA').length;

    // Calcular próximas reservas (futuras y en estado PENDIENTE)
    this.stats.upcomingReservations = this.reservations.filter(r => {
      const reservaDate = new Date(r.fecha);
      return reservaDate >= today && r.estado === 'PENDIENTE';
    }).length;
  }

  getUpcomingReservations(): Reserva[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.reservations
      .filter(r => {
        const reservaDate = new Date(r.fecha);
        return reservaDate >= today && r.estado === 'PENDIENTE';
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();

        if (dateA !== dateB) return dateA - dateB;

        return a.horaInicio.localeCompare(b.horaInicio);
      })
      .slice(0, 3);
  }

  getRecentReservations(): Reserva[] {
    return this.reservations
      .filter(r => r.estado === 'COMPLETADA' || r.estado === 'CANCELADA')
      .sort((a, b) => {
        // Ordenamos por fecha en orden descendente
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        return dateB - dateA;
      })
      .slice(0, 3);
  }

  // Método para formatear fechas
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  // Método para formatear horas (de HH:MM:SS a HH:MM)
  formatTime(timeString: string): string {
    return timeString.substring(0, 5);
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

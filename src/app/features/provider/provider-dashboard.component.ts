import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { User } from '../../core/models/user.model';
import { Reserva } from '../../core/models/reserva.model';
import { Proveedor } from '../../core/models/proveedor.model';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './provider-dashboard.component.html',
})
export class ProviderDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  providerInfo: Proveedor | null = null;
  loading = true;
  reservations: Reserva[] = [];
  currentDate = new Date();
  errorMessage: string = '';

  private subscriptions: Subscription[] = [];

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
    this.loading = true;
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadProviderInfo();
        this.loadReservations();
      } else {
        this.loading = false;
      }
    });

    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    // Limpieza de suscripciones para evitar memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProviderInfo(): void {
    if (!this.currentUser) return;

    const proveedorId = this.currentUser.id;

    const providerSub = this.providerService.getProviderInfo(proveedorId)
      .pipe(
        catchError(error => {
          console.error('Error loading provider info:', error);
          this.errorMessage = 'No se pudo cargar la información del proveedor.';
          throw error;
        })
      )
      .subscribe({
        next: (data) => {
          this.providerInfo = data;
        },
        error: () => {
          // El error ya fue manejado en el operador catchError
          this.loading = false;
        }
      });

    this.subscriptions.push(providerSub);
  }

  loadReservations(): void {
    if (!this.currentUser) return;

    const proveedorId = this.currentUser.id;

    const reservationSub = this.providerService.getMyReservations(proveedorId)
      .pipe(
        catchError(error => {
          console.error('Error loading reservations:', error);
          this.errorMessage = 'No se pudieron cargar las reservas.';
          throw error;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (reservations) => {
          this.reservations = reservations;
          this.calculateStats();
        }
      });

    this.subscriptions.push(reservationSub);
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

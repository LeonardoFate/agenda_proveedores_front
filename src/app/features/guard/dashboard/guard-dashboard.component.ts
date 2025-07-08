import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { User } from '../../../core/models/user.model';
import { Reserva } from '../../../core/models/reserva.model';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-guard-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './guard-dashboard.component.html',
})
export class GuardDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  loading = true;
  todaysReservations: Reserva[] = [];
  stats = {
    pendingToday: 0,
    inPlantToday: 0,
    completedToday: 0,
    totalToday: 0
  };
  currentDate = new Date();

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadTodaysReservations();
    });

    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTodaysReservations(): void {
    this.loading = true;
    // Formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    console.log('Fecha para búsqueda de reservas:', today);

    const reservationSub = this.reservationService.getReservationsByDate(today)
      .pipe(
        finalize(() => {
          this.loading = false;
          console.log('Finalizada carga de reservas');
        })
      )
      .subscribe({
        next: (reservations) => {
          console.log('Reservas recuperadas:', reservations);
          this.todaysReservations = reservations;
          this.calculateStats();
        },
        error: (error) => {
          console.error('Error detallado al cargar reservas:', error);
        }
      });

    this.subscriptions.push(reservationSub);
  }

  calculateStats(): void {
    console.log('Calculando estadísticas con', this.todaysReservations.length, 'reservas');

    this.stats.totalToday = this.todaysReservations.length;
    this.stats.pendingToday = this.todaysReservations.filter(r => r.estado === 'PENDIENTE').length;
    this.stats.inPlantToday = this.todaysReservations.filter(r =>
      r.estado === 'EN_PLANTA' || r.estado === 'EN_RECEPCION'
    ).length;
    this.stats.completedToday = this.todaysReservations.filter(r => r.estado === 'COMPLETADA').length;

    console.log('Estadísticas calculadas:', this.stats);
  }

getNextReservations(): Reserva[] {
  return this.todaysReservations
    .filter(r => r.estado === 'PENDIENTE')
    .sort((a, b) => {
      // ✅ Verificar que ambos valores existan
      if (!a.horaInicio || !b.horaInicio) return 0;
      return a.horaInicio.localeCompare(b.horaInicio);
    })
    .slice(0, 3);
}

getRecentActivity(): Reserva[] {
  return this.todaysReservations
    .filter(r => r.estado !== 'PENDIENTE')
    .sort((a, b) => {
      // ✅ Verificar que ambos valores existan
      if (!a.horaInicio || !b.horaInicio) return 0;
      return b.horaInicio.localeCompare(a.horaInicio);
    })
    .slice(0, 3);
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

// src/app/features/provider/provider-dashboard.component.ts - ACTUALIZADO
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { User } from '../../core/models/user.model';
import { Reserva } from '../../core/models/reserva.model';
import { HorarioProveedor } from '../../core/models/horario-proveedor.model';
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
  weekSchedules: HorarioProveedor[] = [];
  currentDate = new Date();
  errorMessage: string = '';

  private subscriptions: Subscription[] = [];

  stats = {
    pendingConfirmation: 0, // ✅ NUEVO: Pendientes de confirmación
    confirmedReservations: 0, // ✅ NUEVO: Confirmadas
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
      } else {
        this.loading = false;
      }
    });

    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProviderInfo(): void {
    if (!this.currentUser) return;

    const usuarioId = this.currentUser.id;
    console.log('Cargando información del proveedor para el usuario ID:', usuarioId);

    const providerSub = this.providerService.getProviderByUsuarioId(usuarioId)
      .pipe(
        catchError(error => {
          console.error('Error al cargar la información del proveedor:', error);
          this.errorMessage = 'No se pudo cargar la información del proveedor.';
          throw error;
        })
      )
      .subscribe({
        next: (data) => {
          this.providerInfo = data;
          console.log('Información del proveedor cargada:', this.providerInfo);

          // Cargar datos del dashboard
          this.loadDashboardData();
        },
        error: () => {
          this.loading = false;
        }
      });

    this.subscriptions.push(providerSub);
  }

  loadDashboardData(): void {
    if (!this.providerInfo) {
      this.loading = false;
      return;
    }

    // Cargar reservas y horarios de la semana en paralelo
    this.loadReservations();
    this.loadWeekSchedules();
  }

  loadReservations(): void {
    // Usar el nuevo método con filtros opcionales para obtener reservas recientes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysForward = new Date();
    thirtyDaysForward.setDate(thirtyDaysForward.getDate() + 30);

    const reservationSub = this.providerService.getMyReservationsFiltered(
      thirtyDaysAgo.toISOString().split('T')[0],
      thirtyDaysForward.toISOString().split('T')[0]
    )
      .pipe(
        catchError(error => {
          console.error('Error al cargar las reservas:', error);
          this.errorMessage = 'No se pudieron cargar las reservas.';
          return [];
        })
      )
      .subscribe({
        next: (reservations) => {
          this.reservations = reservations;
          this.calculateStats();
          this.checkLoadingComplete();
        }
      });

    this.subscriptions.push(reservationSub);
  }

  loadWeekSchedules(): void {
    // Obtener horarios de la semana actual
    const startOfWeek = this.getStartOfWeek(new Date());
    const weekScheduleSub = this.providerService.getMyWeekSchedule(
      startOfWeek.toISOString().split('T')[0]
    )
      .pipe(
        catchError(error => {
          console.error('Error al cargar horarios de la semana:', error);
          // No es crítico si no hay horarios asignados
          return [];
        })
      )
      .subscribe({
        next: (schedules) => {
          this.weekSchedules = schedules;
          console.log('Horarios de la semana cargados:', schedules.length);
          this.checkLoadingComplete();
        }
      });

    this.subscriptions.push(weekScheduleSub);
  }

  checkLoadingComplete(): void {
    // Simple check - podrías hacer esto más sofisticado con forkJoin
    if (this.reservations !== undefined && this.weekSchedules !== undefined) {
      this.loading = false;
    }
  }

  calculateStats(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.stats.totalReservations = this.reservations.length;

    // ✅ NUEVAS ESTADÍSTICAS
    this.stats.pendingConfirmation = this.reservations.filter(r => r.estado === 'PENDIENTE_CONFIRMACION').length;
    this.stats.confirmedReservations = this.reservations.filter(r => r.estado === 'CONFIRMADA').length;

    // Estadísticas existentes actualizadas
    this.stats.completedReservations = this.reservations.filter(r => r.estado === 'COMPLETADA').length;
    this.stats.inProgressReservations = this.reservations.filter(r =>
      r.estado === 'EN_PLANTA' || r.estado === 'EN_RECEPCION'
    ).length;
    this.stats.canceledReservations = this.reservations.filter(r => r.estado === 'CANCELADA').length;

    // Calcular próximas reservas (futuras y confirmadas o pendientes)
    this.stats.upcomingReservations = this.reservations.filter(r => {
      const reservaDate = new Date(r.fecha);
      return reservaDate >= today && (r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE_CONFIRMACION');
    }).length;
  }

getUpcomingReservations(): Reserva[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.reservations
    .filter(r => {
      const reservaDate = new Date(r.fecha);
      return reservaDate >= today && r.estado !== 'CONFIRMADA';
    })
    .sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();

      if (dateA !== dateB) return dateA - dateB;

      if (a.horaInicio && b.horaInicio) {
        return a.horaInicio.localeCompare(b.horaInicio);
      }
      return 0;
    })
    .slice(0, 3);
}


  getRecentReservations(): Reserva[] {
    return this.reservations
      .filter(r => r.estado === 'CONFIRMADA' || r.estado === 'CANCELADA')
      .sort((a, b) => {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        return dateB - dateA;
      })
      .slice(0, 3);
  }

  // ✅ NUEVOS MÉTODOS PARA MANEJAR HORARIOS ASIGNADOS
  getPendingConfirmationSchedules(): HorarioProveedor[] {
    return this.weekSchedules.filter(s =>
      s.tieneReserva && s.estadoReserva === 'PENDIENTE_CONFIRMACION'
    ).slice(0, 3);
  }

  hasSchedulesToConfirm(): boolean {
    return this.weekSchedules.some(s => s.puedeConfirmar);
  }

  // Método auxiliar para obtener el inicio de la semana
  getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  // Métodos de formateo existentes
formatDate(dateString: string): string {
  if (!dateString) return '';

  // ✅ SOLUCIÓN: Crear fecha en zona local
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

  formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE_CONFIRMACION': return 'bg-orange-100 text-orange-800';
      case 'CONFIRMADA': return 'bg-blue-100 text-blue-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'EN_PLANTA': return 'bg-indigo-100 text-indigo-800';
      case 'EN_RECEPCION': return 'bg-purple-100 text-purple-800';
      case 'COMPLETADA': return 'bg-green-100 text-green-800';
      case 'CANCELADA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusName(status: string): string {
    switch (status) {
      case 'PENDIENTE_CONFIRMACION': return 'Pendiente Confirmación';
      case 'CONFIRMADA': return 'Confirmada';
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PLANTA': return 'En Planta';
      case 'EN_RECEPCION': return 'En Recepción';
      case 'COMPLETADA': return 'Completada';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  }
}

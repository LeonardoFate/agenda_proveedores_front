// src/app/features/provider/schedule/schedule-template-selection.component.ts - LIMPIO
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { HorarioProveedor } from '../../../core/models/horario-proveedor.model';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-schedule-template-selection',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './schedule-template-selection.component.html'
})
export class ScheduleTemplateSelectionComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  availableSchedules: HorarioProveedor[] = [];
  selectedDate: string = '';
  loading = false;
  errorMessage = '';
  minDate: string;
  maxDate: string;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private providerService: ProviderService,
    private router: Router
  ) {
    // Configurar fechas
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    this.maxDate = maxDate.toISOString().split('T')[0];

    // Establecer fecha por defecto
    this.selectedDate = this.minDate;
  }

  ngOnInit(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadMySchedules();
      }
    });

    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onDateChange(): void {
    if (this.selectedDate) {
      this.loadMySchedules();
    }
  }

  loadMySchedules(): void {
    if (!this.selectedDate || !this.currentUser) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.availableSchedules = [];

    const scheduleSub = this.providerService.getMySchedule(this.selectedDate)
      .pipe(
        catchError(error => {
          return this.providerService.getMyWeekSchedule(this.selectedDate).pipe(
            catchError(weekError => {
              if (error.status === 404 || weekError.status === 404) {
                return of([]);
              }
              this.errorMessage = 'Error al cargar los horarios asignados.';
              throw weekError;
            })
          );
        }),
        switchMap(scheduleData => {
          let schedules: HorarioProveedor[] = [];

          if (Array.isArray(scheduleData)) {
            schedules = scheduleData.filter(schedule => schedule.fecha === this.selectedDate);
          } else if (scheduleData && typeof scheduleData === 'object') {
            schedules = [scheduleData];
          }

          if (schedules.length === 0) {
            return of([]);
          }

          const reservationChecks = schedules.map(schedule =>
            this.checkAndUpdateScheduleReservation(schedule)
          );

          return forkJoin(reservationChecks);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (updatedSchedules) => {
          this.availableSchedules = updatedSchedules;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar los horarios y reservas.';
        }
      });

    this.subscriptions.push(scheduleSub);
  }

  private checkAndUpdateScheduleReservation(schedule: HorarioProveedor) {
    if (schedule.tieneReserva === true && schedule.estadoReserva && schedule.reservaId) {
      return of(schedule);
    }

    return this.providerService.getReservationByDate(this.selectedDate)
      .pipe(
        catchError(error => {
          return this.providerService.getMyReservationsFiltered(this.selectedDate, this.selectedDate);
        }),
        map(reservations => {
          const matchingReservation = this.findMatchingReservation(schedule, reservations);

          if (matchingReservation) {
            schedule.tieneReserva = true;
            schedule.estadoReserva = matchingReservation.estado;
            schedule.reservaId = matchingReservation.id;

            if (matchingReservation.areaId) schedule.areaId = matchingReservation.areaId;
            if (matchingReservation.areaNombre) schedule.areaNombre = matchingReservation.areaNombre;
            if (matchingReservation.andenId) schedule.andenId = matchingReservation.andenId;
            if (matchingReservation.andenNumero) schedule.andenNumero = matchingReservation.andenNumero;
            if (matchingReservation.tipoServicioId) schedule.tipoServicioId = matchingReservation.tipoServicioId;
            if (matchingReservation.tipoServicioNombre) schedule.tipoServicioNombre = matchingReservation.tipoServicioNombre;
          } else {
            schedule.tieneReserva = false;
            schedule.estadoReserva = undefined;
            schedule.reservaId = undefined;
          }

          return schedule;
        }),
        catchError(error => {
          schedule.tieneReserva = false;
          schedule.estadoReserva = undefined;
          schedule.reservaId = undefined;

          return of(schedule);
        })
      );
  }

  private findMatchingReservation(schedule: HorarioProveedor, reservations: any[]): any | null {
    if (!reservations || reservations.length === 0) {
      return null;
    }

    return reservations.find(reservation => {
      const reservationStart = reservation.horaInicio || reservation.hora_inicio;
      const reservationEnd = reservation.horaFin || reservation.hora_fin;

      return reservationStart === schedule.horaInicio &&
             reservationEnd === schedule.horaFin;
    });
  }

  canConfirmSchedule(schedule: HorarioProveedor): boolean {
    const hasBasicSchedule = schedule.horaInicio && schedule.horaFin;

    if (!hasBasicSchedule) {
      return false;
    }

    if (!schedule.tieneReserva) {
      return true;
    }

    if (schedule.tieneReserva && schedule.estadoReserva === 'PENDIENTE_CONFIRMACION') {
      return true;
    }

    if (schedule.puedeConfirmar) {
      return true;
    }

    return false;
  }

  getButtonText(schedule: HorarioProveedor): string {
    if (!schedule.tieneReserva) {
      return 'Crear Reserva';
    }

    if (schedule.estadoReserva === 'PENDIENTE_CONFIRMACION') {
      return 'Completar Datos';
    }

    return 'Confirmar';
  }

  completeReservationData(schedule: HorarioProveedor): void {
    this.router.navigate(['/provider/confirm-reservation'], {
      queryParams: {
        fecha: this.selectedDate,
        reservaId: schedule.reservaId || null,
        scheduleData: JSON.stringify({
          horaInicio: schedule.horaInicio,
          horaFin: schedule.horaFin,
          tiempoDescarga: schedule.tiempoDescarga,
          numeroPersonas: schedule.numeroPersonas,
          areaId: schedule.areaId,
          andenId: schedule.andenId,
          tipoServicioId: schedule.tipoServicioId,
          areaNombre: schedule.areaNombre,
          andenNumero: schedule.andenNumero,
          tipoServicioNombre: schedule.tipoServicioNombre
        })
      }
    });
  }

  viewReservation(reservaId: number): void {
    this.router.navigate(['/provider/reservation', reservaId]);
  }

  getConfirmableCount(): number {
    return this.availableSchedules.filter(s => this.canConfirmSchedule(s)).length;
  }

  getConfirmedCount(): number {
    return this.availableSchedules.filter(s =>
      s.tieneReserva && s.estadoReserva === 'CONFIRMADA'
    ).length;
  }

  getStatusDisplayText(schedule: HorarioProveedor): string {
    if (!schedule.tieneReserva) {
      return 'Sin Reserva - Disponible para Crear';
    }

    switch (schedule.estadoReserva) {
      case 'PENDIENTE_CONFIRMACION':
        return 'Pendiente - Complete Datos';
      case 'CONFIRMADA':
        return 'Reserva Confirmada';
      case 'EN_PLANTA':
        return 'En Planta';
      case 'EN_RECEPCION':
        return 'En Recepción';
      case 'COMPLETADA':
        return 'Completada';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return schedule.estadoReserva || 'Estado Desconocido';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

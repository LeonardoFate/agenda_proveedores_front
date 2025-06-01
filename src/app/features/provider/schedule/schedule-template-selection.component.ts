import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { HorarioProveedor } from '../../../core/models/horario-proveedor.model';
import { Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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

    console.log('Cargando horarios para fecha:', this.selectedDate);

    const scheduleSub = this.providerService.getMySchedule(this.selectedDate)
      .pipe(
        catchError(error => {
          console.error('Error al cargar horario individual:', error);
          return this.providerService.getMyWeekSchedule(this.selectedDate).pipe(
            catchError(weekError => {
              console.error('Error al cargar horarios semanales:', weekError);
              if (error.status === 404 || weekError.status === 404) {
                this.availableSchedules = [];
                return [];
              }
              this.errorMessage = 'Error al cargar los horarios asignados.';
              throw weekError;
            })
          );
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos:', data);

          if (Array.isArray(data)) {
            this.availableSchedules = data.filter(schedule => schedule.fecha === this.selectedDate);
          } else if (data && typeof data === 'object') {
            this.availableSchedules = [data];
          } else {
            this.availableSchedules = [];
          }

          console.log('Horarios procesados:', this.availableSchedules);
        }
      });

    this.subscriptions.push(scheduleSub);
  }

  // ✅ LÓGICA CORREGIDA: Determinar si un horario se puede confirmar
  canConfirmSchedule(schedule: HorarioProveedor): boolean {
    if (schedule.puedeConfirmar) {
      return true;
    }

    if (!schedule.tieneReserva) {
      return true; // Horario disponible para crear reserva
    }

    if (schedule.tieneReserva && schedule.estadoReserva === 'PENDIENTE_CONFIRMACION') {
      return true; // Tiene reserva pero necesita completar datos
    }

    return false;
  }

  // Navegar al formulario para completar datos del vehículo y conductor
  completeReservationData(schedule: HorarioProveedor): void {
    console.log('Completando datos para horario:', schedule);

    this.router.navigate(['/provider/confirm-reservation'], {
      queryParams: {
        fecha: this.selectedDate,
        scheduleData: JSON.stringify({
          areaId: schedule.areaId,
          areaNombre: schedule.areaNombre,
          andenId: schedule.andenId,
          andenNumero: schedule.andenNumero,
          tipoServicioId: schedule.tipoServicioId,
          tipoServicioNombre: schedule.tipoServicioNombre,
          horaInicio: schedule.horaInicio,
          horaFin: schedule.horaFin,
          tiempoDescarga: schedule.tiempoDescarga,
          numeroPersonas: schedule.numeroPersonas
        })
      }
    });
  }

  viewReservation(reservaId: number): void {
    this.router.navigate(['/provider/reservation', reservaId]);
  }

  // Métodos auxiliares
  getConfirmableCount(): number {
    return this.availableSchedules.filter(s => this.canConfirmSchedule(s)).length;
  }

  getConfirmedCount(): number {
    return this.availableSchedules.filter(s => s.tieneReserva && s.estadoReserva === 'CONFIRMADA').length;
  }

  getStatusDisplayText(schedule: HorarioProveedor): string {
    if (this.canConfirmSchedule(schedule)) {
      if (!schedule.tieneReserva) {
        return 'Disponible para Confirmar';
      } else {
        return 'Pendiente de Completar Datos';
      }
    }

    if (schedule.tieneReserva) {
      switch (schedule.estadoReserva) {
        case 'CONFIRMADA':
          return 'Confirmada';
        case 'PENDIENTE_CONFIRMACION':
          return 'Pendiente Confirmación';
        default:
          return schedule.estadoReserva || 'En Proceso';
      }
    }

    return 'No Disponible';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

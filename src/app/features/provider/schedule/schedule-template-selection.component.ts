// src/app/features/provider/schedule/schedule-template-selection.component.ts - CORREGIDO COMPLETO
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

  // ✅ CORREGIDO: Lógica para verificar si puede confirmar
  canConfirmSchedule(schedule: HorarioProveedor): boolean {
    const hasBasicSchedule = schedule.horaInicio && schedule.horaFin;

    if (!hasBasicSchedule) {
      console.log('❌ Sin horarios básicos:', schedule);
      return false;
    }

    // ✅ CORREGIDO: Solo puede confirmar si NO tiene reserva o está PENDIENTE_CONFIRMACION
    if (!schedule.tieneReserva) {
      console.log('✅ Sin reserva, puede crear nueva');
      return true; // Sin reserva = puede crear nueva
    }

    if (schedule.tieneReserva && schedule.estadoReserva === 'PENDIENTE_CONFIRMACION') {
      console.log('✅ Reserva pendiente, puede completar datos');
      return true; // PRE-RESERVA = puede completar datos
    }

    if (schedule.puedeConfirmar) {
      console.log('✅ puedeConfirmar = true');
      return true;
    }

    console.log('❌ No puede confirmar:', schedule.estadoReserva);
    // ✅ NUEVO: Si ya está CONFIRMADA u otro estado, NO puede confirmar
    return false;
  }

  // ✅ NUEVO: Método para el texto del botón
  getButtonText(schedule: HorarioProveedor): string {
    if (!schedule.tieneReserva) {
      return 'Crear Reserva';
    }

    if (schedule.estadoReserva === 'PENDIENTE_CONFIRMACION') {
      return 'Completar Datos';
    }

    return 'Confirmar';
  }

  // ✅ MÉTODO CORREGIDO: Remover la validación de recursos
  completeReservationData(schedule: HorarioProveedor): void {
    console.log('📝 Completando datos para horario:', schedule);

    // ✅ REMOVER ESTA VALIDACIÓN QUE BLOQUEA
    // if (!schedule.areaId || !schedule.andenId || !schedule.tipoServicioId) {
    //   this.errorMessage = 'Este horario no tiene recursos asignados. Contacte al administrador.';
    //   return;
    // }

    // ✅ NAVEGAR DIRECTAMENTE AL FORMULARIO
    this.router.navigate(['/provider/confirm-reservation'], {
      queryParams: {
        fecha: this.selectedDate,
        scheduleData: JSON.stringify({
          horaInicio: schedule.horaInicio,
          horaFin: schedule.horaFin,
          tiempoDescarga: schedule.tiempoDescarga,
          numeroPersonas: schedule.numeroPersonas
          // ❌ NO enviar areaId, andenId, tipoServicioId - proveedor los selecciona
        })
      }
    });
  }

  viewReservation(reservaId: number): void {
    this.router.navigate(['/provider/reservation', reservaId]);
  }

  // ✅ MÉTODOS AUXILIARES ACTUALIZADOS
  getConfirmableCount(): number {
    return this.availableSchedules.filter(s => this.canConfirmSchedule(s)).length;
  }

  getConfirmedCount(): number {
    return this.availableSchedules.filter(s =>
      s.tieneReserva && s.estadoReserva === 'CONFIRMADA'
    ).length;
  }

  // ✅ CORREGIDO: Texto de estado más preciso
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

  // Crear fecha en zona local para evitar problemas de UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // Los meses van de 0-11

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
}

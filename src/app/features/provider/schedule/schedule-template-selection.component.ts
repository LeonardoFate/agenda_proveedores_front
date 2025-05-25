// src/app/features/provider/schedule/schedule-template-selection.component.ts
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
  successMessage = '';
  minDate: string;
  maxDate: string;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private providerService: ProviderService,
    private router: Router
  ) {
    // Configurar fechas mínima y máxima (hoy y 3 meses en adelante)
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    this.maxDate = maxDate.toISOString().split('T')[0];

    // Establecer fecha por defecto (hoy)
    this.selectedDate = this.minDate;
  }

  ngOnInit(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        // Cargar horarios para la fecha por defecto
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

    // Primero intentar obtener horarios individuales para la fecha
    const scheduleSub = this.providerService.getMySchedule(this.selectedDate)
      .pipe(
        catchError(error => {
          console.error('Error al cargar horario individual:', error);

          // Si no hay horario individual, intentar cargar horarios semanales
          return this.providerService.getMyWeekSchedule(this.selectedDate).pipe(
            catchError(weekError => {
              console.error('Error al cargar horarios semanales:', weekError);

              // Si tampoco hay horarios semanales, no es un error crítico
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
            // Si es un array, filtrar por la fecha seleccionada
            this.availableSchedules = data.filter(schedule => schedule.fecha === this.selectedDate);
          } else if (data && typeof data === 'object') {
            // Si es un objeto individual, agregarlo al array
            this.availableSchedules = [data];
          } else {
            // Si no hay datos, array vacío
            this.availableSchedules = [];
          }

          console.log('Horarios procesados:', this.availableSchedules);
        },
        error: (error) => {
          // Error ya manejado en catchError
          console.error('Error final:', error);
        }
      });

    this.subscriptions.push(scheduleSub);
  }

  confirmSchedule(schedule: HorarioProveedor): void {
    console.log('Confirmando horario:', schedule);

    // Navegar al formulario de confirmación con los datos de la plantilla
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

  completeReservation(schedule: HorarioProveedor): void {
    console.log('Completando reserva pendiente:', schedule);

    // Si ya tiene una reserva pendiente, navegar para completar datos
    if (schedule.reservaId) {
      // Cargar datos existentes y navegar al formulario de edición
      this.router.navigate(['/provider/confirm-reservation'], {
        queryParams: {
          fecha: this.selectedDate,
          reservaId: schedule.reservaId,
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
    } else {
      // Si no tiene reservaId, tratar como confirmación nueva
      this.confirmSchedule(schedule);
    }
  }

  viewReservation(reservaId: number): void {
    this.router.navigate(['/provider/reservation', reservaId]);
  }

  // Método auxiliar para formatear fechas
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Método auxiliar para obtener el nombre del día de la semana
  getDayName(dateString: string): string {
    const date = new Date(dateString);
    const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    return days[date.getDay()];
  }
}

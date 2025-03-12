// src/app/features/guard/entries/entry-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaDetalle } from '../../../core/models/reserva.model';
import { User } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-entry-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './entry-detail.component.html'
})
export class EntryDetailComponent implements OnInit, OnDestroy {
  reservationId: number = 0;
  reservation: ReservaDetalle | null = null;
  timeRecords: any[] = [];
  currentUser: User | null = null;
  loading = true;
  loadingAction = false;
  errorMessage: string = '';
  successMessage: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      // Obtener el ID de la reserva de la URL
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.reservationId = +id;
        this.loadReservationDetails();
      }
    });

    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadReservationDetails(): void {
    this.loading = true;
    console.log('Cargando detalles de reserva ID:', this.reservationId);

    // Obtener detalles de la reserva
    const detailsSub = this.reservationService.getReservationById(this.reservationId).subscribe({
      next: (data) => {
        console.log('Detalles de reserva cargados:', data);
        this.reservation = data;
        this.loadTimeRecords();
      },
      error: (error) => {
        console.error('Error loading reservation details', error);
        this.loading = false;
        this.errorMessage = 'No se pudo cargar los detalles de la reserva.';
        setTimeout(() => {
          this.router.navigate(['/guard/entries']);
        }, 2000);
      }
    });

    this.subscriptions.push(detailsSub);
  }

  loadTimeRecords(): void {
    console.log('Cargando registros de tiempo para reserva ID:', this.reservationId);

    // Obtener registros de tiempo
    const recordsSub = this.reservationService.getTimeRecordsByReservation(this.reservationId).subscribe({
      next: (data) => {
        console.log('Registros de tiempo cargados:', data);
        this.timeRecords = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading time records', error);
        this.timeRecords = [];
        this.loading = false;
      }
    });

    this.subscriptions.push(recordsSub);
  }

  // Método para iniciar un registro de tiempo
  startTimeRecord(type: string): void {
    if (!this.currentUser || !this.reservation) {
      console.error('No hay usuario o reserva');
      return;
    }

    this.loadingAction = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('Iniciando registro de tiempo:', {
      reservaId: this.reservationId,
      usuarioId: this.currentUser.id,
      tipo: type
    });

    const startSub = this.reservationService.startTimeRecord(
      this.reservationId,
      this.currentUser.id,
      type
    ).pipe(
      finalize(() => {
        if (!this.successMessage && !this.errorMessage) {
          this.loadingAction = false;
        }
      })
    ).subscribe({
      next: (response) => {
        console.log('Registro de tiempo iniciado:', response);
        this.successMessage = 'Registro iniciado correctamente';

        // Actualizar la lista de registros
        this.loadTimeRecords();

        // Si es un ingreso a planta, actualizar el estado de la reserva
        if (type === 'INGRESO_PLANTA' && this.reservation?.estado === 'PENDIENTE') {
          this.updateReservationStatus('EN_PLANTA');
        }
      },
      error: (error) => {
        console.error('Error starting time record', error);
        this.errorMessage = 'Ocurrió un error al registrar el tiempo. Intente nuevamente.';
        this.loadingAction = false;
      }
    });

    this.subscriptions.push(startSub);
  }

  // Método para finalizar un registro de tiempo
  finishTimeRecord(recordId: number, type: string): void {
    this.loadingAction = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('Finalizando registro de tiempo ID:', recordId, 'Tipo:', type);

    const finishSub = this.reservationService.finishTimeRecord(recordId)
      .pipe(
        finalize(() => {
          if (!this.successMessage && !this.errorMessage) {
            this.loadingAction = false;
          }
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Registro de tiempo finalizado:', response);
          this.successMessage = 'Registro finalizado correctamente';

          // Actualizar la lista de registros
          this.loadTimeRecords();

          // Si es una salida de planta, actualizar el estado a COMPLETADA solo si
          // se cumple la condición y no hay errores
          if (type === 'SALIDA_PLANTA' &&
              (this.reservation?.estado === 'EN_PLANTA' || this.reservation?.estado === 'EN_RECEPCION')) {

            // Pequeño retraso para asegurar que el registro se actualizó
            setTimeout(() => {
              this.updateReservationStatus('COMPLETADA');
            }, 500);
          }
        },
        error: (error) => {
          console.error('Error detallado al finalizar registro:', error);

          if (error.status === 400 && error.error && error.error.mensaje) {
            this.errorMessage = error.error.mensaje;
          } else {
            this.errorMessage = 'Ocurrió un error al finalizar el registro de tiempo. Intente nuevamente.';
          }

          this.loadingAction = false;
        }
      });

    this.subscriptions.push(finishSub);
  }

  // Método para actualizar el estado de la reserva
  updateReservationStatus(newStatus: string): void {
    if (!this.reservation) {
      console.error('No hay reserva para actualizar estado');
      return;
    }

    console.log('Actualizando estado de reserva a:', newStatus);

    const updateSub = this.reservationService.updateReservationStatus(this.reservationId, newStatus)
      .pipe(
        finalize(() => {
          this.loadingAction = false;
        })
      )
      .subscribe({
        next: (updatedReservation) => {
          console.log('Reserva actualizada:', updatedReservation);
          this.reservation = updatedReservation;
          this.successMessage = `Estado actualizado a ${this.getStatusName(newStatus)} correctamente`;
        },
        error: (error) => {
          console.error('Error detallado al actualizar estado:', error);

          if (error.status === 400 && error.error && error.error.mensaje) {
            this.errorMessage = error.error.mensaje;
          } else {
            this.errorMessage = 'Ocurrió un error al actualizar el estado de la reserva. Intente nuevamente.';
          }
        }
      });

    this.subscriptions.push(updateSub);
  }

  // Métodos de formateo y utilidades
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  }

  formatDateTime(dateTimeString: string | null | undefined): string {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('es-ES');
  }

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

  getRecordTypeName(type: string): string {
    switch (type) {
      case 'INGRESO_PLANTA': return 'Ingreso a Planta';
      case 'SALIDA_PLANTA': return 'Salida de Planta';
      case 'INICIO_RECEPCION': return 'Inicio de Recepción';
      case 'FIN_RECEPCION': return 'Fin de Recepción';
      default: return type;
    }
  }

  // Método para mostrar mensajes de error o éxito
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}

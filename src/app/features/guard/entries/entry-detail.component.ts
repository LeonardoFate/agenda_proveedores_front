// src/app/features/guard/entries/entry-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaDetalle } from '../../../core/models/reserva.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-entry-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './entry-detail.component.html'
})
export class EntryDetailComponent implements OnInit {
  reservationId: number = 0;
  reservation: ReservaDetalle | null = null;
  timeRecords: any[] = [];
  currentUser: User | null = null;
  loading = true;
  loadingAction = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      // Obtener el ID de la reserva de la URL
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.reservationId = +id;
        this.loadReservationDetails();
      }
    });
  }

  loadReservationDetails(): void {
    this.loading = true;

    // Obtener detalles de la reserva
    this.reservationService.getReservationById(this.reservationId).subscribe({
      next: (data) => {
        this.reservation = data;
        this.loadTimeRecords();
      },
      error: (error) => {
        console.error('Error loading reservation details', error);
        this.loading = false;
        alert('No se pudo cargar los detalles de la reserva.');
        this.router.navigate(['/guard/entries']);
      }
    });
  }

  loadTimeRecords(): void {
    // Obtener registros de tiempo
    this.reservationService.getTimeRecordsByReservation(this.reservationId).subscribe({
      next: (data) => {
        this.timeRecords = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading time records', error);
        this.timeRecords = [];
        this.loading = false;
      }
    });
  }

  // Método para iniciar un registro de tiempo
  startTimeRecord(type: string): void {
    if (!this.currentUser || !this.reservation) {
      return;
    }

    this.loadingAction = true;

    this.reservationService.startTimeRecord(
      this.reservationId,
      this.currentUser.id,
      type
    ).subscribe({
      next: (response) => {
        // Actualizar la lista de registros
        this.loadTimeRecords();

        // Si es un ingreso a planta, actualizar el estado de la reserva
        if (type === 'INGRESO_PLANTA' && this.reservation?.estado === 'PENDIENTE') {
          this.updateReservationStatus('EN_PLANTA');
        } else {
          this.loadingAction = false;
        }
      },
      error: (error) => {
        console.error('Error starting time record', error);
        this.loadingAction = false;
        alert('Ocurrió un error al registrar el tiempo. Intente nuevamente.');
      }
    });
  }

  // Método para finalizar un registro de tiempo
  finishTimeRecord(recordId: number, type: string): void {
    this.loadingAction = true;

    this.reservationService.finishTimeRecord(recordId).subscribe({
      next: () => {
        // Actualizar la lista de registros
        this.loadTimeRecords();

        // Si es una salida de planta y la reserva está completada, actualizar el estado
        if (type === 'SALIDA_PLANTA' &&
            (this.reservation?.estado === 'EN_PLANTA' || this.reservation?.estado === 'EN_RECEPCION')) {
          this.updateReservationStatus('COMPLETADA');
        } else {
          this.loadingAction = false;
        }
      },
      error: (error) => {
        console.error('Error finishing time record', error);
        this.loadingAction = false;
        alert('Ocurrió un error al finalizar el registro de tiempo. Intente nuevamente.');
      }
    });
  }

  // Método para actualizar el estado de la reserva
  updateReservationStatus(newStatus: string): void {
    if (!this.reservation) {
      return;
    }

    this.reservationService.updateReservationStatus(this.reservationId, newStatus).subscribe({
      next: (updatedReservation) => {
        this.reservation = updatedReservation;
        this.loadingAction = false;
      },
      error: (error) => {
        console.error('Error updating reservation status', error);
        this.loadingAction = false;
        alert('Ocurrió un error al actualizar el estado de la reserva. Intente nuevamente.');
      }
    });
  }

  // Método para formatear fechas
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  // Método para formatear horas
  formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  }

  // Método para formatear fecha y hora completa
  formatDateTime(dateTimeString: string | null | undefined): string {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('es-ES');
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

  // Método para traducir los tipos de registro
  getRecordTypeName(type: string): string {
    switch (type) {
      case 'INGRESO_PLANTA': return 'Ingreso a Planta';
      case 'SALIDA_PLANTA': return 'Salida de Planta';
      case 'INICIO_RECEPCION': return 'Inicio de Recepción';
      case 'FIN_RECEPCION': return 'Fin de Recepción';
      default: return type;
    }
  }
}

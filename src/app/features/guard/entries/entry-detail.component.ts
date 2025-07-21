import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservaDetalle, EstadoReserva } from '../../../core/models/reserva.model';
import { User } from '../../../core/models/user.model';
import { Subscription, forkJoin, of } from 'rxjs';
import { finalize, catchError, switchMap, tap } from 'rxjs/operators';

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

  // ✅ Hacer el enum disponible en el template
  EstadoReserva = EstadoReserva;

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

  // ✅ Método para iniciar un registro de tiempo
  startTimeRecord(type: string): void {
    if (!this.currentUser || !this.reservation) {
      console.error('No hay usuario o reserva');
      return;
    }

    this.loadingAction = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('Procesando registro de tiempo:', {
      reservaId: this.reservationId,
      usuarioId: this.currentUser.id,
      tipo: type
    });

    // Si es salida de planta, primero finalizamos todos los registros activos
    if (type === 'SALIDA_PLANTA') {
      this.processSalida();
    } else {
      // Si es ingreso a planta u otro tipo, flujo normal
      this.processIngreso(type);
    }
  }

  // ✅ Método para verificar si ya se ha registrado una salida
  hasSalidaRecord(): boolean {
    if (!this.timeRecords || this.timeRecords.length === 0) {
      return false;
    }

    // Buscar si ya existe algún registro de tipo SALIDA_PLANTA
    return this.timeRecords.some(record => record.tipo === 'SALIDA_PLANTA');
  }

  // ✅ Método para procesar un ingreso a planta
private processIngreso(type: string): void {
  const startSub = this.reservationService.startTimeRecord(
    this.reservationId,
    this.currentUser!.id,
    type
  ).pipe(
    switchMap(response => {
      console.log('Registro de tiempo iniciado:', response);

      // ✅ SIMPLIFICAR: Solo verificar CONFIRMADA (sin PENDIENTE)
      if (type === 'INGRESO_PLANTA' && this.reservation?.estado === 'CONFIRMADA') {
        console.log('Actualizando estado de reserva a EN_PLANTA');
        return this.reservationService.updateReservationStatus(
          this.reservationId,
          EstadoReserva.EN_PLANTA
        );
      }
      return of(this.reservation);
    }),
    // ... resto del código igual
  );
}

  // ✅ Método para procesar una salida de planta con finalización automática
  private processSalida(): void {
    const salidaSub = this.reservationService.getTimeRecordsByReservation(this.reservationId)
      .pipe(
        switchMap(records => {
          // Buscar registros activos (sin horaFin)
          const activeRecords = records.filter(r => !r.horaFin);

          if (activeRecords.length > 0) {
            // Finalizar todos los registros activos en paralelo
            const finishRequests = activeRecords.map(record =>
              this.reservationService.finishTimeRecord(record.id)
            );

            if (finishRequests.length > 0) {
              return forkJoin(finishRequests);
            }
          }
          return of(null);
        }),
        // Luego crear el registro de salida
        switchMap(() => this.reservationService.startTimeRecord(
          this.reservationId,
          this.currentUser!.id,
          'SALIDA_PLANTA'
        )),
        // Finalizar automáticamente el registro de salida recién creado
        switchMap(response => {
          if (response && response.id) {
            return this.reservationService.finishTimeRecord(response.id);
          }
          return of(null);
        }),
        // Actualizar el estado de la reserva a COMPLETADA
        switchMap(() => {
          return this.reservationService.updateReservationStatus(
            this.reservationId,
            EstadoReserva.COMPLETADA
          );
        }),
        tap(updatedReservation => {
          if (updatedReservation) {
            this.reservation = updatedReservation;
            console.log('Estado de reserva actualizado después de la salida:', this.reservation.estado);
          }
          this.successMessage = 'Salida registrada correctamente';
        }),
        // Asegurar que finalize siempre se ejecute, independientemente del resultado
        finalize(() => {
          this.loadingAction = false;
          this.loadTimeRecords();  // Recargar registros después de todas las operaciones
        })
      )
      .subscribe({
        next: () => {
          // El caso de éxito ya se maneja en el operador tap() de arriba
          console.log('Proceso de salida completado exitosamente');
        },
        error: (error) => {
          console.error('Error en proceso de salida:', error);
          if (error.status === 400 && error.error && error.error.mensaje) {
            this.errorMessage = error.error.mensaje;
          } else {
            this.errorMessage = 'Ocurrió un error al registrar la salida. Intente nuevamente.';
          }
          // El estado de carga se resetea en finalize()
        }
      });

    this.subscriptions.push(salidaSub);
  }

  // ✅ Método para actualizar el estado de la reserva
  updateReservationStatus(newStatus: EstadoReserva): void {
    if (!this.reservation) {
      console.error('No hay reserva para actualizar estado');
      return;
    }

    console.log('Actualizando estado de reserva a:', newStatus);
    this.loadingAction = true;
    this.errorMessage = '';
    this.successMessage = '';

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

  // ===== MÉTODOS DE FORMATEO Y UTILIDADES =====

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '--/--/----';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  formatTime(timeString: string | undefined | null): string {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  }

  formatDateTime(dateTimeString: string | null | undefined): string {
    if (!dateTimeString) return '--';
    const date = new Date(dateTimeString);
    return date.toLocaleString('es-ES');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE_CONFIRMACION': return 'bg-orange-100 text-orange-800';
      case 'CONFIRMADA': return 'bg-blue-100 text-blue-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'EN_PLANTA': return 'bg-blue-100 text-blue-800';
      case 'EN_RECEPCION': return 'bg-purple-100 text-purple-800';
      case 'COMPLETADA': return 'bg-green-100 text-green-800';
      case 'CANCELADA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusName(status: string | EstadoReserva): string {
    // ✅ Convertir a string de forma segura
    let statusStr: string;

    if (typeof status === 'string') {
      statusStr = status;
    } else {
      statusStr = String(status);
    }

    switch (statusStr) {
      case 'PENDIENTE_CONFIRMACION': return 'Pendiente Confirmación';
      case 'CONFIRMADA': return 'Confirmada';
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PLANTA': return 'En Planta';
      case 'EN_RECEPCION': return 'En Recepción';
      case 'COMPLETADA': return 'Completada';
      case 'CANCELADA': return 'Cancelada';
      default: return statusStr;
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

  // ✅ Método para mostrar mensajes de error o éxito
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ✅ Método para verificar si se puede mostrar el botón de salida
  canShowSalidaButton(): boolean {
    const validStates = ['EN_PLANTA', 'EN_RECEPCION', 'COMPLETADA'];

    return this.reservation?.estado
      ? validStates.includes(this.reservation.estado)
      : false;
  }

  // ✅ Método para verificar si se puede mostrar el botón de ingreso
  canShowIngresoButton(): boolean {
    return this.reservation?.estado === 'CONFIRMADA';
  }
}

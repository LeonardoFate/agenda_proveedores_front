import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { User } from '../../../core/models/user.model';
import { Reserva } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-receptions-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './receptions-list.component.html'
})
export class ReceptionsListComponent implements OnInit {
  currentUser: User | null = null;
  reservations: Reserva[] = [];
  filteredReservations: Reserva[] = [];
  loading = true;
  searchTerm = '';
  selectedDate = '';
  statusFilter = '';

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    // Inicializar la fecha seleccionada con la fecha actual
    this.selectedDate = new Date().toISOString().split('T')[0];

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadReservations();
    });
  }

  loadReservations(): void {
    this.loading = true;

    if (this.selectedDate) {
      this.reservationService.getReservationsByDate(this.selectedDate).subscribe({
        next: (data) => {
          this.reservations = data;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading reservations', error);
          this.loading = false;
        }
      });
    } else {
      this.reservationService.getAllReservations().subscribe({
        next: (data) => {
          this.reservations = data;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading reservations', error);
          this.loading = false;
        }
      });
    }
  }

  applyFilters(): void {
    this.filteredReservations = this.reservations.filter(reservation => {
      // Filtro por estado
      const matchesStatus = !this.statusFilter || reservation.estado === this.statusFilter;

      // Filtro por término de búsqueda
      const matchesSearch = !this.searchTerm ||
        reservation.proveedorNombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        reservation.transportePlaca?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        reservation.id?.toString().includes(this.searchTerm);

      return matchesStatus && matchesSearch;
    });
  }

  onDateChange(): void {
    this.loadReservations();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  startReception(reservationId: number): void {
    if (!this.currentUser) return;

    this.loading = true;

    // Primero actualizar el estado a EN_RECEPCION
    this.reservationService.updateReservationStatus(reservationId, 'EN_RECEPCION').subscribe({
      next: () => {
        // Luego iniciar el registro de tiempo
        this.reservationService.startTimeRecord(
          reservationId,
          this.currentUser!.id,
          'INICIO_RECEPCION'
        ).subscribe({
          next: () => {
            // Actualizar la lista local
            const reservation = this.reservations.find(r => r.id === reservationId);
            if (reservation) {
              reservation.estado = 'EN_RECEPCION';
            }
            this.applyFilters();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error starting reception', error);
            this.loading = false;
            alert('Error al iniciar la recepción. Intente nuevamente.');
          }
        });
      },
      error: (error) => {
        console.error('Error updating reservation status', error);
        this.loading = false;
        alert('Error al actualizar el estado de la reserva. Intente nuevamente.');
      }
    });
  }

  completeReception(reservationId: number): void {
    if (!this.currentUser) return;

    // Buscar el registro de tiempo para finalizar
    this.loading = true;

    this.reservationService.getTimeRecordsByReservation(reservationId).subscribe({
      next: (records) => {
        // Buscar el registro de INICIO_RECEPCION sin finalizar
        const record = records.find(r => r.tipo === 'INICIO_RECEPCION' && !r.horaFin);

        if (record) {
          // Finalizar el registro de tiempo
          this.reservationService.finishTimeRecord(record.id).subscribe({
            next: () => {
              // Actualizar la lista local
              const reservation = this.reservations.find(r => r.id === reservationId);
              if (reservation) {
                reservation.estado = 'COMPLETADA';
              }
              this.applyFilters();
              this.loading = false;
            },
            error: (error) => {
              console.error('Error completing reception', error);
              this.loading = false;
              alert('Error al completar la recepción. Intente nuevamente.');
            }
          });
        } else {
          this.loading = false;
          alert('No se encontró un registro de inicio de recepción activo.');
        }
      },
      error: (error) => {
        console.error('Error loading time records', error);
        this.loading = false;
        alert('Error al cargar los registros de tiempo. Intente nuevamente.');
      }
    });
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

// src/app/features/guard/entries/entry-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Reserva } from '../../../core/models/reserva.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-entry-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './entry-management.component.html'
})
export class EntryManagementComponent implements OnInit {
  reservations: Reserva[] = [];
  filteredReservations: Reserva[] = [];
  currentUser: User | null = null;
  loading = true;
  searchTerm = '';
  selectedDate = '';

  // Filtro específico para entradas/salidas
  statusFilter: 'all' | 'pending' | 'inPlant' = 'all';

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService
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
    let filtered = this.reservations;

    // Aplicar filtro de estado específico para entradas/salidas
    if (this.statusFilter === 'pending') {
      filtered = filtered.filter(r => r.estado === 'PENDIENTE');
    } else if (this.statusFilter === 'inPlant') {
      filtered = filtered.filter(r =>
        r.estado === 'EN_PLANTA' || r.estado === 'EN_RECEPCION'
      );
    }

    // Aplicar filtro de búsqueda
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.proveedorNombre?.toLowerCase().includes(search) ||
        r.transportePlaca?.toLowerCase().includes(search) ||
        r.id?.toString().includes(search)
      );
    }

    this.filteredReservations = filtered;
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

  // Método para actualizar el estado de una reserva
  updateReservationStatus(id: number, newStatus: string): void {
    this.loading = true;

    this.reservationService.updateReservationStatus(id, newStatus).subscribe({
      next: () => {
        // Actualizar el estado en el array local
        const reservation = this.reservations.find(r => r.id === id);
        if (reservation) {
          reservation.estado = newStatus as any;
        }
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error updating reservation status', error);
        this.loading = false;
        alert('Ocurrió un error al actualizar el estado. Intente nuevamente.');
      }
    });
  }

  // Método para iniciar un registro de tiempo
  startTimeRecord(reservationId: number, type: string): void {
    if (!this.currentUser) {
      alert('Debe iniciar sesión para realizar esta acción.');
      return;
    }

    this.loading = true;

    this.reservationService.startTimeRecord(
      reservationId,
      this.currentUser.id,
      type
    ).subscribe({
      next: () => {
        // Si es un ingreso a planta, actualizar el estado de la reserva
        if (type === 'INGRESO_PLANTA') {
          this.updateReservationStatus(reservationId, 'EN_PLANTA');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error starting time record', error);
        this.loading = false;
        alert('Ocurrió un error al registrar el tiempo. Intente nuevamente.');
      }
    });
  }

  // Mostrar el tiempo en formato HH:MM
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

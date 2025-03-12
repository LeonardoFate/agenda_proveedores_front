import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { Reserva } from '../../../core/models/reserva.model';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-reservations.component.html'
})
export class MyReservationsComponent implements OnInit {
  currentUser: User | null = null;
  reservations: Reserva[] = [];
  filteredReservations: Reserva[] = [];
  loading = true;

  // Filtros
  searchTerm = '';
  statusFilter = '';
  dateFilter: 'all' | 'upcoming' | 'past' | 'today' = 'all';

  constructor(
    private authService: AuthService,
    private providerService: ProviderService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadReservations();
      } else {
        this.loading = false;
      }
    });
  }

  loadReservations(): void {
    if (!this.currentUser) return;

    const proveedorId = this.currentUser.id; // Asumimos mismo ID

    this.loading = true;
    this.providerService.getMyReservations(proveedorId).subscribe({
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

  applyFilters(): void {
    let filtered = [...this.reservations];

    // Filtrar por estado
    if (this.statusFilter) {
      filtered = filtered.filter(r => r.estado === this.statusFilter);
    }

    // Filtrar por fecha
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.dateFilter === 'upcoming') {
      filtered = filtered.filter(r => {
        const reservaDate = new Date(r.fecha);
        return reservaDate >= today;
      });
    } else if (this.dateFilter === 'past') {
      filtered = filtered.filter(r => {
        const reservaDate = new Date(r.fecha);
        return reservaDate < today;
      });
    } else if (this.dateFilter === 'today') {
      filtered = filtered.filter(r => {
        const reservaDate = new Date(r.fecha);
        const todayDate = new Date();
        return reservaDate.getDate() === todayDate.getDate() &&
               reservaDate.getMonth() === todayDate.getMonth() &&
               reservaDate.getFullYear() === todayDate.getFullYear();
      });
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.areaNombre?.toLowerCase().includes(searchLower) ||
        r.tipoServicioNombre?.toLowerCase().includes(searchLower) ||
        r.transportePlaca?.toLowerCase().includes(searchLower) ||
        r.id?.toString().includes(this.searchTerm)
      );
    }

    // Ordenar por fecha (más reciente primero)
    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha + 'T' + a.horaInicio);
      const dateB = new Date(b.fecha + 'T' + b.horaInicio);
      return dateB.getTime() - dateA.getTime();
    });

    this.filteredReservations = filtered;
  }

  cancelReservation(id: number): void {
    if (confirm('¿Está seguro de cancelar esta reserva? Esta acción no se puede deshacer.')) {
      this.loading = true;

      this.providerService.cancelReservation(id).subscribe({
        next: () => {
          // Actualizar el estado en nuestro array local
          const reservation = this.reservations.find(r => r.id === id);
          if (reservation) {
            reservation.estado = 'CANCELADA';
          }

          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error canceling reservation', error);
          this.loading = false;
          alert('Ocurrió un error al cancelar la reserva. Intente nuevamente.');
        }
      });
    }
  }

  // Método para formatear fechas
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  // Método para formatear horas
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

  // Verificar si se puede editar una reserva (solo pendientes)
  canEdit(reservation: Reserva): boolean {
    return reservation.estado === 'PENDIENTE';
  }

  // Verificar si se puede cancelar una reserva (solo pendientes)
  canCancel(reservation: Reserva): boolean {
    return reservation.estado === 'PENDIENTE';
  }
}

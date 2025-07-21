// src/app/features/provider/reservations/my-reservations.component.ts - COMPLETO ACTUALIZADO
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { Reserva, EstadoReserva } from '../../../core/models/reserva.model';
import { Proveedor } from '../../../core/models/proveedor.model';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-reservations.component.html'
})
export class MyReservationsComponent implements OnInit {
  currentUser: User | null = null;
  providerInfo: Proveedor | null = null;
  reservations: Reserva[] = [];
  filteredReservations: Reserva[] = [];
  loading = true;
  errorMessage = '';

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
        this.loadProviderInfo();
      } else {
        this.loading = false;
      }
    });
  }

  loadProviderInfo(): void {
    if (!this.currentUser) return;

    this.loading = true;
    console.log('Obteniendo información de proveedor para usuario ID:', this.currentUser.id);

    this.providerService.getProviderByUsuarioId(this.currentUser.id).subscribe({
      next: (data) => {
        this.providerInfo = data;
        console.log('Información de proveedor obtenida:', data);
        this.loadReservations();
      },
      error: (error) => {
        console.error('Error obteniendo información del proveedor:', error);
        this.errorMessage = 'No se pudo obtener la información del proveedor.';
        this.loading = false;
      }
    });
  }

  loadReservations(): void {
    if (!this.providerInfo) {
      console.error('No se puede cargar reservas: providerInfo es null');
      this.loading = false;
      return;
    }

    console.log('Cargando reservas para proveedor:', this.providerInfo.nombre);

    // ✅ SOLUCIÓN: Ampliar el rango para incluir reservas futuras
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // ✅ CAMBIO: Incluir también reservas futuras (próximos 6 meses)
    const sixMonthsForward = new Date();
    sixMonthsForward.setMonth(sixMonthsForward.getMonth() + 6);

    this.providerService.getMyReservationsFiltered(
      sixMonthsAgo.toISOString().split('T')[0],      // Desde hace 6 meses
      sixMonthsForward.toISOString().split('T')[0]   // Hasta dentro de 6 meses
    ).subscribe({
      next: (data) => {
        console.log('📊 TODAS las reservas recibidas:', data.length);
        console.log('📊 Estados recibidos:', data.map(r => `ID${r.id}: ${r.estado} - ${r.fecha}`));

        // ✅ FILTRAR TODOS LOS ESTADOS EXCEPTO PENDIENTE_CONFIRMACION
        this.reservations = data.filter(reserva =>
          reserva.estado !== 'PENDIENTE_CONFIRMACION'
        );

        console.log('✅ Reservas después del filtro (sin pendientes):', this.reservations.length);
        console.log('✅ Estados finales:', this.reservations.map(r => `ID${r.id}: ${r.estado} - ${r.fecha}`));

        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando reservas:', error);
        this.errorMessage = 'Error al cargar las reservas. Por favor intente nuevamente.';
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
      const dateA = new Date(a.fecha + 'T' + (a.horaInicio || '00:00'));
      const dateB = new Date(b.fecha + 'T' + (b.horaInicio || '00:00'));
      return dateB.getTime() - dateA.getTime();
    });

    this.filteredReservations = filtered;
    console.log('🎯 Reservas después de aplicar filtros:', this.filteredReservations.length);
  }

  cancelReservation(id: number): void {
    if (confirm('¿Está seguro de cancelar esta reserva? Esta acción no se puede deshacer.')) {
      this.loading = true;

      this.providerService.cancelReservation(id).subscribe({
        next: () => {
          // ✅ Usar el enum en lugar del string literal
          const reservation = this.reservations.find(r => r.id === id);
          if (reservation) {
            reservation.estado = EstadoReserva.CANCELADA;
          }

          this.applyFilters();
          this.loading = false;
          console.log('✅ Reserva cancelada exitosamente:', id);
        },
        error: (error) => {
          console.error('Error canceling reservation', error);
          this.loading = false;
          alert('Ocurrió un error al cancelar la reserva. Intente nuevamente.');
        }
      });
    }
  }

  // ✅ MÉTODO CORREGIDO: Formateo de fechas sin problemas de zona horaria
  formatDate(dateString: string): string {
    if (!dateString) return '';

    // ✅ CREAR FECHA EN ZONA LOCAL para evitar problemas de UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Los meses van de 0-11

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Método para formatear horas
  formatTime(timeString: string | null | undefined): string {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  }

  // ✅ ACTUALIZADO: Incluir nuevos estados
  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDIENTE_CONFIRMACION': return 'bg-orange-100 text-orange-800';
      case 'CONFIRMADA': return 'bg-blue-100 text-blue-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      case 'EN_PLANTA': return 'bg-indigo-100 text-indigo-800';
      case 'EN_RECEPCION': return 'bg-purple-100 text-purple-800';
      case 'COMPLETADA': return 'bg-green-100 text-green-800';
      case 'CANCELADA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // ✅ ACTUALIZADO: Incluir nuevos estados
  getStatusName(status: string): string {
    switch (status) {
      case 'PENDIENTE_CONFIRMACION': return 'Pend. Confirmación';
      case 'CONFIRMADA': return 'Confirmada';
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PLANTA': return 'En Planta';
      case 'EN_RECEPCION': return 'En Recepción';
      case 'COMPLETADA': return 'Completada';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  }

  // ✅ ACTUALIZADO: Verificar si se puede editar una reserva
  canEdit(reservation: Reserva): boolean {
    return reservation.estado === 'CONFIRMADA' ||
           reservation.estado === 'PENDIENTE_CONFIRMACION';
  }

  // ✅ ACTUALIZADO: Verificar si se puede cancelar una reserva
  canCancel(reservation: Reserva): boolean {
    return reservation.estado === 'CONFIRMADA' ||
           reservation.estado === 'PENDIENTE_CONFIRMACION';
  }
}

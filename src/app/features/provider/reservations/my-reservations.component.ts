// // src/app/features/provider/reservations/my-reservations.component.ts - COMPLETO ACTUALIZADO
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { AuthService } from '../../../core/services/auth.service';
// import { ProviderService } from '../../../core/services/provider.service';
// import { User } from '../../../core/models/user.model';
// import { Reserva } from '../../../core/models/reserva.model';
// import { Proveedor } from '../../../core/models/proveedor.model';

// @Component({
//   selector: 'app-my-reservations',
//   standalone: true,
//   imports: [CommonModule, RouterModule, FormsModule],
//   templateUrl: './my-reservations.component.html'
// })
// export class MyReservationsComponent implements OnInit {
//   currentUser: User | null = null;
//   providerInfo: Proveedor | null = null;
//   reservations: Reserva[] = [];
//   filteredReservations: Reserva[] = [];
//   loading = true;
//   errorMessage = '';

//   // Filtros
//   searchTerm = '';
//   statusFilter = '';
//   dateFilter: 'all' | 'upcoming' | 'past' | 'today' = 'all';

//   constructor(
//     private authService: AuthService,
//     private providerService: ProviderService
//   ) {}

//   ngOnInit(): void {
//     this.authService.currentUser$.subscribe(user => {
//       this.currentUser = user;
//       if (user) {
//         this.loadProviderInfo();
//       } else {
//         this.loading = false;
//       }
//     });
//   }

//   loadProviderInfo(): void {
//     if (!this.currentUser) return;

//     this.loading = true;
//     console.log('Obteniendo información de proveedor para usuario ID:', this.currentUser.id);

//     this.providerService.getProviderByUsuarioId(this.currentUser.id).subscribe({
//       next: (data) => {
//         this.providerInfo = data;
//         console.log('Información de proveedor obtenida:', data);
//         this.loadReservations();
//       },
//       error: (error) => {
//         console.error('Error obteniendo información del proveedor:', error);
//         this.errorMessage = 'No se pudo obtener la información del proveedor.';
//         this.loading = false;
//       }
//     });
//   }

//   loadReservations(): void {
//     if (!this.providerInfo) {
//       console.error('No se puede cargar reservas: providerInfo es null');
//       this.loading = false;
//       return;
//     }

//     // ✅ USAR EL NUEVO MÉTODO CON FILTROS
//     console.log('Cargando reservas para proveedor:', this.providerInfo.nombre);

//     // Obtener reservas de los últimos 6 meses
//     const sixMonthsAgo = new Date();
//     sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
//     const today = new Date();

//     this.providerService.getMyReservationsFiltered(
//       sixMonthsAgo.toISOString().split('T')[0],
//       today.toISOString().split('T')[0]
//     ).subscribe({
//       next: (data) => {
//         this.reservations = data;
//         console.log('Reservas cargadas:', data.length);
//         this.applyFilters();
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error cargando reservas:', error);
//         this.errorMessage = 'Error al cargar las reservas. Por favor intente nuevamente.';
//         this.loading = false;
//       }
//     });
//   }

//   applyFilters(): void {
//     let filtered = [...this.reservations];

//     // Filtrar por estado
//     if (this.statusFilter) {
//       filtered = filtered.filter(r => r.estado === this.statusFilter);
//     }

//     // Filtrar por fecha
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (this.dateFilter === 'upcoming') {
//       filtered = filtered.filter(r => {
//         const reservaDate = new Date(r.fecha);
//         return reservaDate >= today;
//       });
//     } else if (this.dateFilter === 'past') {
//       filtered = filtered.filter(r => {
//         const reservaDate = new Date(r.fecha);
//         return reservaDate < today;
//       });
//     } else if (this.dateFilter === 'today') {
//       filtered = filtered.filter(r => {
//         const reservaDate = new Date(r.fecha);
//         const todayDate = new Date();
//         return reservaDate.getDate() === todayDate.getDate() &&
//                reservaDate.getMonth() === todayDate.getMonth() &&
//                reservaDate.getFullYear() === todayDate.getFullYear();
//       });
//     }

//     // Filtrar por término de búsqueda
//     if (this.searchTerm) {
//       const searchLower = this.searchTerm.toLowerCase();
//       filtered = filtered.filter(r =>
//         r.areaNombre?.toLowerCase().includes(searchLower) ||
//         r.tipoServicioNombre?.toLowerCase().includes(searchLower) ||
//         r.transportePlaca?.toLowerCase().includes(searchLower) ||
//         r.id?.toString().includes(this.searchTerm)
//       );
//     }

//     // Ordenar por fecha (más reciente primero)
//     filtered.sort((a, b) => {
//       const dateA = new Date(a.fecha + 'T' + (a.horaInicio || '00:00'));
//       const dateB = new Date(b.fecha + 'T' + (b.horaInicio || '00:00'));
//       return dateB.getTime() - dateA.getTime();
//     });

//     this.filteredReservations = filtered;
//   }

//   cancelReservation(id: number): void {
//     if (confirm('¿Está seguro de cancelar esta reserva? Esta acción no se puede deshacer.')) {
//       this.loading = true;

//       this.providerService.cancelReservation(id).subscribe({
//         next: () => {
//           // Actualizar el estado en nuestro array local
//           const reservation = this.reservations.find(r => r.id === id);
//           if (reservation) {
//             reservation.estado = 'CANCELADA';
//           }

//           this.applyFilters();
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Error canceling reservation', error);
//           this.loading = false;
//           alert('Ocurrió un error al cancelar la reserva. Intente nuevamente.');
//         }
//       });
//     }
//   }

//   // Método para formatear fechas
//   formatDate(dateString: string): string {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('es-ES');
//   }

//   // Método para formatear horas
//   formatTime(timeString: string | null | undefined): string {
//     if (!timeString) return '-';
//     return timeString.substring(0, 5);
//   }

//   // ✅ ACTUALIZADO: Incluir nuevos estados
//   getStatusClass(status: string): string {
//     switch (status) {
//       case 'PENDIENTE_CONFIRMACION': return 'bg-orange-100 text-orange-800';
//       case 'CONFIRMADA': return 'bg-blue-100 text-blue-800';
//       case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
//       case 'EN_PLANTA': return 'bg-indigo-100 text-indigo-800';
//       case 'EN_RECEPCION': return 'bg-purple-100 text-purple-800';
//       case 'COMPLETADA': return 'bg-green-100 text-green-800';
//       case 'CANCELADA': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   }

//   // ✅ ACTUALIZADO: Incluir nuevos estados
//   getStatusName(status: string): string {
//     switch (status) {
//       case 'PENDIENTE_CONFIRMACION': return 'Pend. Confirmación';
//       case 'CONFIRMADA': return 'Confirmada';
//       case 'PENDIENTE': return 'Pendiente';
//       case 'EN_PLANTA': return 'En Planta';
//       case 'EN_RECEPCION': return 'En Recepción';
//       case 'COMPLETADA': return 'Completada';
//       case 'CANCELADA': return 'Cancelada';
//       default: return status;
//     }
//   }

//   // ✅ ACTUALIZADO: Verificar si se puede editar una reserva
//   canEdit(reservation: Reserva): boolean {
//     return reservation.estado === 'PENDIENTE' ||
//            reservation.estado === 'CONFIRMADA' ||
//            reservation.estado === 'PENDIENTE_CONFIRMACION';
//   }

//   // ✅ ACTUALIZADO: Verificar si se puede cancelar una reserva
//   canCancel(reservation: Reserva): boolean {
//     return reservation.estado === 'PENDIENTE' ||
//            reservation.estado === 'CONFIRMADA' ||
//            reservation.estado === 'PENDIENTE_CONFIRMACION';
//   }
// }

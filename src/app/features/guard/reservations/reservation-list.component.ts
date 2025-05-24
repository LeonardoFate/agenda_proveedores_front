// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { ReservationService } from '../../../core/services/reservation.service';
// import { AuthService } from '../../../core/services/auth.service';
// import { Reserva } from '../../../core/models/reserva.model';
// import { User } from '../../../core/models/user.model';

// @Component({
//   selector: 'app-reservation-list',
//   standalone: true,
//   imports: [CommonModule, RouterModule, FormsModule],
//   templateUrl: './reservation-list.component.html'
// })
// export class ReservationListComponent implements OnInit {
//   reservations: Reserva[] = [];
//   filteredReservations: Reserva[] = [];
//   currentUser: User | null = null;
//   loading = true;
//   searchTerm = '';
//   selectedDate = '';
//   statusFilter = '';

//   constructor(
//     private reservationService: ReservationService,
//     private authService: AuthService
//   ) {}

//   ngOnInit(): void {
//     // Inicializar la fecha seleccionada con la fecha actual
//     this.selectedDate = new Date().toISOString().split('T')[0];

//     this.authService.currentUser$.subscribe(user => {
//       this.currentUser = user;
//       this.loadReservations();
//     });
//   }

//   loadReservations(): void {
//     this.loading = true;

//     if (this.selectedDate) {
//       this.reservationService.getReservationsByDate(this.selectedDate).subscribe({
//         next: (data) => {
//           this.reservations = data;
//           this.applyFilters();
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Error loading reservations', error);
//           this.loading = false;
//         }
//       });
//     } else {
//       this.reservationService.getAllReservations().subscribe({
//         next: (data) => {
//           this.reservations = data;
//           this.applyFilters();
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Error loading reservations', error);
//           this.loading = false;
//         }
//       });
//     }
//   }

//   applyFilters(): void {
//     this.filteredReservations = this.reservations.filter(reservation => {
//       const matchesSearchTerm = !this.searchTerm ||
//         reservation.proveedorNombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
//         reservation.transportePlaca?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
//         reservation.id?.toString().includes(this.searchTerm);

//       const matchesStatus = !this.statusFilter || reservation.estado === this.statusFilter;

//       return matchesSearchTerm && matchesStatus;
//     });
//   }

//   onDateChange(): void {
//     this.loadReservations();
//   }

//   onStatusFilterChange(): void {
//     this.applyFilters();
//   }

//   onSearch(): void {
//     this.applyFilters();
//   }

//   // Método para formatear horas (de HH:MM:SS a HH:MM)
//   formatTime(timeString: string): string {
//     return timeString.substring(0, 5);
//   }

//   // Método para obtener una clase de color basada en el estado de la reserva
//   getStatusClass(status: string): string {
//     switch (status) {
//       case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
//       case 'EN_PLANTA': return 'bg-blue-100 text-blue-800';
//       case 'EN_RECEPCION': return 'bg-purple-100 text-purple-800';
//       case 'COMPLETADA': return 'bg-green-100 text-green-800';
//       case 'CANCELADA': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   }

//   // Método para traducir los estados
//   getStatusName(status: string): string {
//     switch (status) {
//       case 'PENDIENTE': return 'Pendiente';
//       case 'EN_PLANTA': return 'En Planta';
//       case 'EN_RECEPCION': return 'En Recepción';
//       case 'COMPLETADA': return 'Completada';
//       case 'CANCELADA': return 'Cancelada';
//       default: return status;
//     }
//   }
// }

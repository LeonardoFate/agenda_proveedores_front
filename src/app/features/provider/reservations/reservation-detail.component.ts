// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, ActivatedRoute, Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { AuthService } from '../../../core/services/auth.service';
// import { ProviderService } from '../../../core/services/provider.service';
// import { User } from '../../../core/models/user.model';
// import { ReservaDetalle } from '../../../core/models/reserva.model';

// @Component({
//   selector: 'app-reservation-detail',
//   standalone: true,
//   imports: [CommonModule, RouterModule, FormsModule],
//   templateUrl: './reservation-detail.component.html'
// })
// export class ReservationDetailComponent implements OnInit {
//   currentUser: User | null = null;
//   reservationId: number = 0;
//   reservation: ReservaDetalle | null = null;
//   documents: any[] = [];
//   loading = true;
//   loadingAction = false;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private authService: AuthService,
//     private providerService: ProviderService
//   ) {}

//   ngOnInit(): void {
//     this.authService.currentUser$.subscribe(user => {
//       this.currentUser = user;

//       // Obtener el ID de la reserva de la URL
//       const id = this.route.snapshot.paramMap.get('id');
//       if (id) {
//         this.reservationId = +id;
//         this.loadReservationDetails();
//       }
//     });
//   }

//   loadReservationDetails(): void {
//     this.loading = true;

//     // Obtener detalles de la reserva
//     this.providerService.getReservationById(this.reservationId).subscribe({
//       next: (data) => {
//         this.reservation = data;
//         this.loadDocuments();
//       },
//       error: (error) => {
//         console.error('Error loading reservation details', error);
//         this.loading = false;
//         alert('No se pudo cargar los detalles de la reserva.');
//         this.router.navigate(['/provider/my-reservations']);
//       }
//     });
//   }

//   loadDocuments(): void {
//     // Obtener documentos asociados
//     this.providerService.getDocumentsByReservation(this.reservationId).subscribe({
//       next: (data) => {
//         this.documents = data;
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading documents', error);
//         this.documents = [];
//         this.loading = false;
//       }
//     });
//   }

//   cancelReservation(): void {
//     if (!this.reservation) return;

//     if (this.reservation.estado !== 'PENDIENTE') {
//       alert('Solo se pueden cancelar reservas en estado Pendiente.');
//       return;
//     }

//     if (confirm('¿Está seguro de cancelar esta reserva? Esta acción no se puede deshacer.')) {
//       this.loadingAction = true;

//       this.providerService.cancelReservation(this.reservationId).subscribe({
//         next: () => {
//           // Actualizar el estado en nuestro objeto local
//           if (this.reservation) {
//             this.reservation.estado = 'CANCELADA';
//           }

//           this.loadingAction = false;
//           alert('Reserva cancelada exitosamente.');
//         },
//         error: (error) => {
//           console.error('Error canceling reservation', error);
//           this.loadingAction = false;
//           alert('Ocurrió un error al cancelar la reserva. Intente nuevamente.');
//         }
//       });
//     }
//   }

//   downloadDocument(documentId: number, documentName: string): void {
//     this.loadingAction = true;

//     this.providerService.downloadDocument(documentId).subscribe({
//       next: (data) => {
//         const blob = new Blob([data]);
//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = documentName;
//         link.click();

//         // Limpiar
//         window.URL.revokeObjectURL(url);
//         this.loadingAction = false;
//       },
//       error: (error) => {
//         console.error('Error downloading document', error);
//         this.loadingAction = false;
//         alert('No se pudo descargar el documento. Intente nuevamente.');
//       }
//     });
//   }

//   uploadDocument(event: any): void {
//     const file = event.target.files[0];
//     if (!file) return;

//     this.loadingAction = true;

//     const descripcion = prompt('Ingrese una descripción para el documento (opcional):');

//     this.providerService.uploadDocument(this.reservationId, file, descripcion || undefined).subscribe({
//       next: () => {
//         this.loadDocuments(); // Recargar documentos
//         this.loadingAction = false;
//       },
//       error: (error) => {
//         console.error('Error uploading document', error);
//         this.loadingAction = false;
//         alert('No se pudo subir el documento. Intente nuevamente.');
//       }
//     });
//   }

//   deleteDocument(documentId: number): void {
//     if (confirm('¿Está seguro de eliminar este documento? Esta acción no se puede deshacer.')) {
//       this.loadingAction = true;

//       this.providerService.deleteDocument(documentId).subscribe({
//         next: () => {
//           this.documents = this.documents.filter(d => d.id !== documentId);
//           this.loadingAction = false;
//         },
//         error: (error) => {
//           console.error('Error deleting document', error);
//           this.loadingAction = false;
//           alert('No se pudo eliminar el documento. Intente nuevamente.');
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

//   // Método para formatear tamaño de archivo
//   formatFileSize(bytes: number): string {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

//   // Verificar si se puede editar una reserva (solo pendientes)
//   canEdit(): boolean {
//     return this.reservation?.estado === 'PENDIENTE';
//   }

//   // Verificar si se puede cancelar una reserva (solo pendientes)
//   canCancel(): boolean {
//     return this.reservation?.estado === 'PENDIENTE';
//   }

//   // Verificar si se pueden subir documentos
//   canUploadDocuments(): boolean {
//     return this.reservation?.estado !== 'CANCELADA';
//   }
// }

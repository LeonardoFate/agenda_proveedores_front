import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { ProviderService } from '../../../../core/services/provider.service';
import { User } from '../../../../core/models/user.model';
import { ReservaDetalle } from '../../../../core/models/reserva.model';

@Component({
  selector: 'app-reception-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reception-detail.component.html'
})
export class ReceptionDetailComponent implements OnInit {
  currentUser: User | null = null;
  reservationId: number = 0;
  reservation: ReservaDetalle | null = null;
  documents: any[] = [];
  timeRecords: any[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private reservationService: ReservationService,
    private providerService: ProviderService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      // Obtener el ID de la reserva de la URL
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.reservationId = +id;
        this.loadReservationDetails();
      } else {
        this.router.navigate(['/agent/receptions']);
      }
    });
  }

  loadReservationDetails(): void {
    this.loading = true;

    this.reservationService.getReservationById(this.reservationId).subscribe({
      next: (data) => {
        this.reservation = data;
        this.loadDocuments();
        this.loadTimeRecords();
      },
      error: (error) => {
        console.error('Error cargando detalles de la reserva', error);
        this.loading = false;
        alert('No se pudo cargar los detalles de la reserva');
        this.router.navigate(['/agent/receptions']);
      }
    });
  }

  loadDocuments(): void {
    this.providerService.getDocumentsByReservation(this.reservationId).subscribe({
      next: (data) => {
        this.documents = data;
      },
      error: (error) => {
        console.error('Error cargando documentos', error);
        this.documents = [];
      }
    });
  }

  loadTimeRecords(): void {
    this.reservationService.getTimeRecordsByReservation(this.reservationId).subscribe({
      next: (data) => {
        this.timeRecords = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando registros de tiempo', error);
        this.timeRecords = [];
        this.loading = false;
      }
    });
  }

  downloadDocument(documentId: number, documentName: string): void {
    this.providerService.downloadDocument(documentId).subscribe({
      next: (data) => {
        const blob = new Blob([data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = documentName;
        link.click();

        // Limpiar
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error descargando documento', error);
        alert('No se pudo descargar el documento');
      }
    });
  }

  startReception(): void {
    if (!this.currentUser || !this.reservation) return;

    this.loading = true;

    // Actualizar estado a EN_RECEPCION
    this.reservationService.updateReservationStatus(this.reservationId, 'EN_RECEPCION').subscribe({
      next: () => {
        // Iniciar registro de tiempo
        this.reservationService.startTimeRecord(
          this.reservationId,
          this.currentUser!.id,
          'INICIO_RECEPCION'
        ).subscribe({
          next: () => {
            if (this.reservation) {
              this.reservation.estado = 'EN_RECEPCION';
            }
            this.loadTimeRecords();
          },
          error: (error) => {
            console.error('Error iniciando recepción', error);
            this.loading = false;
            alert('Error al iniciar el registro de tiempo de recepción');
          }
        });
      },
      error: (error) => {
        console.error('Error actualizando estado de reserva', error);
        this.loading = false;
        alert('Error al actualizar el estado de la reserva');
      }
    });
  }

  completeReception(): void {
    if (!this.currentUser || !this.reservation) return;

    this.loading = true;

    // Buscar el registro de tiempo activo
    const activeRecord = this.timeRecords.find(r => r.tipo === 'INICIO_RECEPCION' && !r.horaFin);

    if (activeRecord) {
      // Finalizar el registro de tiempo
      this.reservationService.finishTimeRecord(activeRecord.id).subscribe({
        next: () => {
          // Actualizar el estado a COMPLETADA
          this.reservationService.updateReservationStatus(this.reservationId, 'COMPLETADA').subscribe({
            next: () => {
              if (this.reservation) {
                this.reservation.estado = 'COMPLETADA';
              }
              this.loadTimeRecords();
            },
            error: (error) => {
              console.error('Error completando recepción', error);
              this.loading = false;
              alert('Error al actualizar el estado de la reserva');
            }
          });
        },
        error: (error) => {
          console.error('Error finalizando registro de tiempo', error);
          this.loading = false;
          alert('Error al finalizar el registro de tiempo');
        }
      });
    } else {
      alert('No se encontró un registro de tiempo activo para esta recepción');
      this.loading = false;
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  formatTime(timeString: string | undefined): string {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '-';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0) result += `${minutes}m `;
    result += `${remainingSeconds}s`;

    return result;
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

  getTimeRecordTypeName(type: string): string {
    switch (type) {
      case 'INGRESO_PLANTA': return 'Ingreso a Planta';
      case 'SALIDA_PLANTA': return 'Salida de Planta';
      case 'INICIO_RECEPCION': return 'En Recepción';
      case 'FIN_RECEPCION': return 'Fin de Recepción';
      default: return type;
    }
  }
}

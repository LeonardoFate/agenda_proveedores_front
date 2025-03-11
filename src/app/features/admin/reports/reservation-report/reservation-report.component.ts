// src/app/features/admin/reports/reservation-report/reservation-report.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, ReservationStat, AreaStat } from '../../../../core/services/report.service';

@Component({
  selector: 'app-reservation-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-report.component.html'
})
export class ReservationReportComponent implements OnInit, OnChanges {
  @Input() startDate: string = '';
  @Input() endDate: string = '';

  loading: boolean = false;
  reservationStats: ReservationStat[] = [];
  areaStats: AreaStat[] = [];

  // Totales calculados
  totalReservations: number = 0;
  completedReservations: number = 0;
  canceledReservations: number = 0;
  pendingReservations: number = 0;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['startDate'] && !changes['startDate'].firstChange) ||
        (changes['endDate'] && !changes['endDate'].firstChange)) {
      this.loadData();
    }
  }

  loadData(): void {
    if (this.startDate && this.endDate) {
      this.loading = true;

      // Obtener estadísticas de reservas
      this.reportService.getReservationStats(this.startDate, this.endDate).subscribe({
        next: (data) => {
          this.reservationStats = data;

          // Calcular totales
          this.totalReservations = data.reduce((sum, item) => sum + item.total, 0);
          this.completedReservations = data.reduce((sum, item) => sum + item.completed, 0);
          this.canceledReservations = data.reduce((sum, item) => sum + item.canceled, 0);
          this.pendingReservations = data.reduce((sum, item) => sum + item.pending, 0);

          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener estadísticas de reservas', error);
          this.loading = false;
        }
      });

      // Obtener estadísticas por área
      this.reportService.getAreaStats(this.startDate, this.endDate).subscribe({
        next: (data) => {
          this.areaStats = data;
        },
        error: (error) => {
          console.error('Error al obtener estadísticas por área', error);
        }
      });
    }
  }

  // Método para formatear fechas a un formato legible
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

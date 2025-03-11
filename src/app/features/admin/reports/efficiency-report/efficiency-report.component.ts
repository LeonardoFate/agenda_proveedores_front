// src/app/features/admin/reports/efficiency-report/efficiency-report.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, EfficiencyStat } from '../../../../core/services/report.service';

@Component({
  selector: 'app-efficiency-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './efficiency-report.component.html'
})
export class EfficiencyReportComponent implements OnInit, OnChanges {
  @Input() startDate: string = '';
  @Input() endDate: string = '';

  loading: boolean = false;
  efficiencyStats: EfficiencyStat[] = [];

  // Valores promedio calculados
  averageUtilization: number = 0;
  averageTimePerReservation: number = 0;

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

      this.reportService.getEfficiencyStats(this.startDate, this.endDate).subscribe({
        next: (data) => {
          this.efficiencyStats = data;

          // Calcular promedios si hay datos
          if (data.length > 0) {
            this.averageUtilization = data.reduce((sum, item) => sum + item.utilizationPercentage, 0) / data.length;
            this.averageTimePerReservation = data.reduce((sum, item) => sum + item.averageTimePerReservation, 0) / data.length;
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener estadísticas de eficiencia', error);
          this.loading = false;
        }
      });
    }
  }

  // Método para formatear tiempo (minutos a horas:minutos)
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Método para determinar la clase de color según el porcentaje de utilización
  getUtilizationColorClass(percentage: number): string {
    if (percentage < 30) return 'text-red-500';
    if (percentage < 60) return 'text-yellow-500';
    return 'text-green-500';
  }
}

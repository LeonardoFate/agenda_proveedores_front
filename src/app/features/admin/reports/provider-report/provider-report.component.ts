// src/app/features/admin/reports/provider-report/provider-report.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, ProviderStat } from '../../../../core/services/report.service';

@Component({
  selector: 'app-provider-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-report.component.html'
})
export class ProviderReportComponent implements OnInit, OnChanges {
  @Input() startDate: string = '';
  @Input() endDate: string = '';

  loading: boolean = false;
  providerStats: ProviderStat[] = [];

  // Valores promedio calculados
  averageCompletionRate: number = 0;
  averageTimeFormatted: string = 'Sin datos'; // ✅ Cambiar a string

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

      this.reportService.getProviderStats(this.startDate, this.endDate).subscribe({
        next: (data) => {
          this.providerStats = data;

          // Calcular promedios si hay datos
          if (data.length > 0) {
            this.averageCompletionRate = data.reduce((sum, item) => sum + item.completedPercentage, 0) / data.length;

            // ✅ CALCULAR PROMEDIO DE TIEMPO USANDO LOS SEGUNDOS
            const totalSeconds = data.reduce((sum, item) => sum + (item.averageTimeInSeconds || 0), 0);
            const averageSeconds = totalSeconds / data.length;
            this.averageTimeFormatted = this.formatDuration(averageSeconds);
          } else {
            this.averageCompletionRate = 0;
            this.averageTimeFormatted = 'Sin datos';
          }

          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener estadísticas de proveedores', error);
          this.loading = false;
        }
      });
    }
  }

  // ✅ MÉTODO PARA FORMATEAR DURACIÓN
  formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) {
      return 'Sin datos';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (secs > 0 && hours === 0) result += `${secs}s`;

    return result.trim() || '< 1s';
  }

  // Método para determinar la clase de color según el porcentaje de completado
  getCompletionColorClass(percentage: number): string {
    if (percentage < 70) return 'text-red-500';
    if (percentage < 90) return 'text-yellow-500';
    return 'text-green-500';
  }
}

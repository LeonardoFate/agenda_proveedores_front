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

  // Para ordenamiento
  sortField: keyof ProviderStat = 'reservationsCount';
  sortDirection: 'asc' | 'desc' = 'desc';

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
          this.sortData(); // Ordenar los datos inicialmente
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener estadísticas de proveedores', error);
          this.loading = false;
        }
      });
    }
  }

  // Métodos para ordenar los datos
  sortBy(field: keyof ProviderStat): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc'; // Por defecto descendente
    }

    this.sortData();
  }

  sortData(): void {
    this.providerStats.sort((a, b) => {
      // Obtener los valores a comparar
      const valueA = a[this.sortField];
      const valueB = b[this.sortField];

      // Comparar según el tipo de datos
      let comparison = 0;
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      }

      // Aplicar dirección del ordenamiento
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Método para formatear tiempo (minutos a horas:minutos)
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Método para determinar la clase de color según el porcentaje
  getPercentageColorClass(percentage: number): string {
    if (percentage < 70) return 'text-red-500';
    if (percentage < 85) return 'text-yellow-500';
    return 'text-green-500';
  }

  // Método para determinar la clase de color según el tiempo promedio
  getTimeColorClass(minutes: number): string {
    if (minutes > 120) return 'text-red-500';
    if (minutes > 90) return 'text-yellow-500';
    return 'text-green-500';
  }
}

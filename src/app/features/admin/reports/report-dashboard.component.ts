// src/app/features/admin/reports/report-dashboard.component.ts - ACTUALIZADO
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReservationReportComponent } from '../reports/reservation-report/reservation-report.component';
import { EfficiencyReportComponent } from './efficiency-report/efficiency-report.component';
import { ProviderReportComponent } from './provider-report/provider-report.component';
import { ReportService } from '../../../core/services/report.service';

@Component({
  selector: 'app-report-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ReservationReportComponent,
    EfficiencyReportComponent,
    ProviderReportComponent
  ],
  templateUrl: './report-dashboard.component.html',
})
export class ReportDashboardComponent implements OnInit {
  activeTab: string = 'reservations';
  loading: boolean = false;
  startDate: string = '';
  endDate: string = '';

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    // Inicializar fechas para el último mes
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    this.startDate = lastMonth.toISOString().split('T')[0];

    console.log('📅 Fechas inicializadas:', { startDate: this.startDate, endDate: this.endDate });
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    console.log('🔄 Cambiando a pestaña:', tabName);
  }

  // ✅ MÉTODO ACTUALIZADO para manejar la exportación
  exportData(format: 'pdf' | 'excel'): void {
    console.log('📤 Intentando exportar:', { format, tab: this.activeTab });

    // Por ahora mostrar un mensaje de que no está disponible
    alert(`La exportación en formato ${format.toUpperCase()} estará disponible próximamente.`);

    /*
    // ✅ CÓDIGO PARA CUANDO EL BACKEND SOPORTE EXPORTACIÓN
    this.loading = true;

    this.reportService.exportReport(
      this.activeTab,
      format,
      this.startDate,
      this.endDate
    ).subscribe({
      next: (response) => {
        // Crear un blob a partir de la respuesta
        const blob = new Blob([response], {
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Crear URL para el blob
        const url = window.URL.createObjectURL(blob);

        // Crear enlace para descargar
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${this.activeTab}-${this.startDate}-al-${this.endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();

        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al exportar el reporte', error);
        this.loading = false;
        alert('La funcionalidad de exportación no está disponible en este momento.');
      }
    });
    */
  }
}

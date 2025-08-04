// src/app/core/services/report.service.ts - COMPLETAMENTE CORREGIDO
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ReservationStat {
  date: string;
  total: number;
  completed: number;
  canceled: number;
  pending: number;
}

export interface AreaStat {
  areaName: string;
  total: number;
  percentage: number;
}

export interface ProviderStat {
  providerName: string;
  reservationsCount: number;
  completedPercentage: number;
  averageTime: string;        // ✅ Formato legible del backend
  averageTimeInSeconds: number; // ✅ Para cálculos
}

export interface EfficiencyStat {
  andenNumber: number;
  areaName: string;
  utilizationPercentage: number;
  averageTimePerReservation: string; // ✅ Formato legible del backend
  averageTimeInSeconds: number;      // ✅ Para cálculos
  reservationsCount: number;
}

export interface ReportSummary {
  totalReservations: number;
  completedReservations: number;
  canceledReservations: number;
  pendingReservations: number;
  completionRate: number;
  cancellationRate: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/reports`;
  private reservasUrl = `${environment.apiUrl}/api/reservas`;
  private areasUrl = `${environment.apiUrl}/api/areas`;
  private andenesUrl = `${environment.apiUrl}/api/andenes`;
  private proveedoresUrl = `${environment.apiUrl}/api/proveedores`;

  constructor(private http: HttpClient) {}

  // ===== MÉTODOS QUE USAN LOS NUEVOS ENDPOINTS DEDICADOS =====

  // Obtener estadísticas de reservas por fecha
  getReservationStats(startDate: string, endDate: string): Observable<ReservationStat[]> {
    console.log('🔍 Obteniendo estadísticas de reservas:', { startDate, endDate });

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ReservationStat[]>(`${this.apiUrl}/reservations`, { params }).pipe(
      map(data => {
        console.log('📊 Estadísticas de reservas obtenidas:', data);
        return data;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas de reservas:', error);
        // Fallback al método alternativo si el endpoint no existe
        return this.getReservationStatsLegacy(startDate, endDate);
      })
    );
  }

  // Obtener estadísticas por área
  getAreaStats(startDate: string, endDate: string): Observable<AreaStat[]> {
    console.log('🔍 Obteniendo estadísticas por área:', { startDate, endDate });

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<AreaStat[]>(`${this.apiUrl}/areas`, { params }).pipe(
      map(data => {
        console.log('📊 Estadísticas por área obtenidas:', data);
        return data;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas por área:', error);
        // Fallback al método alternativo
        return this.getAreaStatsLegacy(startDate, endDate);
      })
    );
  }

  // Obtener estadísticas de eficiencia de andenes
  getEfficiencyStats(startDate: string, endDate: string): Observable<EfficiencyStat[]> {
    console.log('🔍 Obteniendo estadísticas de eficiencia:', { startDate, endDate });

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<EfficiencyStat[]>(`${this.apiUrl}/efficiency`, { params }).pipe(
      map(data => {
        console.log('📊 Estadísticas de eficiencia obtenidas:', data);
        return data;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas de eficiencia:', error);
        // Fallback al método alternativo
        return this.getEfficiencyStatsLegacy(startDate, endDate);
      })
    );
  }

  // Obtener estadísticas de proveedores
  getProviderStats(startDate: string, endDate: string): Observable<ProviderStat[]> {
    console.log('🔍 Obteniendo estadísticas de proveedores:', { startDate, endDate });

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ProviderStat[]>(`${this.apiUrl}/providers`, { params }).pipe(
      map(data => {
        console.log('📊 Estadísticas de proveedores obtenidas:', data);
        return data;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas de proveedores:', error);
        // Fallback al método alternativo
        return this.getProviderStatsLegacy(startDate, endDate);
      })
    );
  }

  // Obtener resumen general
  getReportSummary(startDate: string, endDate: string): Observable<ReportSummary> {
    console.log('🔍 Obteniendo resumen general:', { startDate, endDate });

    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<ReportSummary>(`${this.apiUrl}/summary`, { params }).pipe(
      map(data => {
        console.log('📊 Resumen general obtenido:', data);
        return data;
      }),
      catchError(error => {
        console.error('❌ Error obteniendo resumen general:', error);
        // Fallback al método alternativo
        return this.getReportSummaryLegacy(startDate, endDate);
      })
    );
  }

  // ===== MÉTODOS LEGACY (FALLBACK) =====

  private getReservationStatsLegacy(startDate: string, endDate: string): Observable<ReservationStat[]> {
    console.log('🔄 Usando método legacy para estadísticas de reservas');
    return this.getReservasForPeriod(startDate, endDate).pipe(
      map(reservas => {
        console.log('📊 Reservas obtenidas para reportes:', reservas);
        return this.processReservationStats(reservas, startDate, endDate);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas de reservas:', error);
        return of([]);
      })
    );
  }

  private getAreaStatsLegacy(startDate: string, endDate: string): Observable<AreaStat[]> {
    console.log('🔄 Usando método legacy para estadísticas por área');
    return forkJoin({
      reservas: this.getReservasForPeriod(startDate, endDate),
      areas: this.http.get<any[]>(this.areasUrl)
    }).pipe(
      map(({ reservas, areas }) => {
        console.log('📊 Datos para estadísticas de área:', { reservas: reservas.length, areas: areas.length });
        return this.processAreaStats(reservas, areas);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas por área:', error);
        return of([]);
      })
    );
  }

  private getEfficiencyStatsLegacy(startDate: string, endDate: string): Observable<EfficiencyStat[]> {
    console.log('🔄 Usando método legacy para estadísticas de eficiencia');
    return forkJoin({
      reservas: this.getReservasForPeriod(startDate, endDate),
      andenes: this.http.get<any[]>(this.andenesUrl),
      areas: this.http.get<any[]>(this.areasUrl)
    }).pipe(
      map(({ reservas, andenes, areas }) => {
        console.log('📊 Datos para estadísticas de eficiencia:', {
          reservas: reservas.length,
          andenes: andenes.length,
          areas: areas.length
        });
        return this.processEfficiencyStats(reservas, andenes, areas, startDate, endDate);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas de eficiencia:', error);
        return of([]);
      })
    );
  }

  private getProviderStatsLegacy(startDate: string, endDate: string): Observable<ProviderStat[]> {
    console.log('🔄 Usando método legacy para estadísticas de proveedores');
    return forkJoin({
      reservas: this.getReservasForPeriod(startDate, endDate),
      proveedores: this.http.get<any[]>(this.proveedoresUrl)
    }).pipe(
      map(({ reservas, proveedores }) => {
        console.log('📊 Datos para estadísticas de proveedores:', {
          reservas: reservas.length,
          proveedores: proveedores.length
        });
        return this.processProviderStats(reservas, proveedores);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo estadísticas de proveedores:', error);
        return of([]);
      })
    );
  }

  private getReportSummaryLegacy(startDate: string, endDate: string): Observable<ReportSummary> {
    console.log('🔄 Usando método legacy para resumen general');
    return this.getReservasForPeriod(startDate, endDate).pipe(
      map(reservas => {
        return this.processReportSummary(reservas, startDate, endDate);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo resumen general:', error);
        return of({
          totalReservations: 0,
          completedReservations: 0,
          canceledReservations: 0,
          pendingReservations: 0,
          completionRate: 0,
          cancellationRate: 0,
          period: { startDate, endDate }
        });
      })
    );
  }

  // ===== MÉTODOS AUXILIARES PARA OBTENER Y PROCESAR DATOS =====

  private getReservasForPeriod(startDate: string, endDate: string): Observable<any[]> {
    console.log('🔍 Obteniendo reservas del período:', { startDate, endDate });

    return this.http.get<any[]>(this.reservasUrl).pipe(
      map(reservas => this.filterReservasByDate(reservas, startDate, endDate)),
      catchError(error => {
        console.error('❌ Error obteniendo reservas:', error);
        return of([]);
      })
    );
  }

  private filterReservasByDate(reservas: any[], startDate: string, endDate: string): any[] {
    if (!reservas || reservas.length === 0) {
      console.log('⚠️ No hay reservas para filtrar');
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const filtradas = reservas.filter(reserva => {
      if (!reserva.fecha) return false;

      const reservaDate = new Date(reserva.fecha);
      return reservaDate >= start && reservaDate <= end;
    });

    console.log(`📊 Reservas filtradas: ${filtradas.length} de ${reservas.length} total`);
    return filtradas;
  }

  // ✅ HELPER PARA FORMATEAR DURACIÓN (COMO EN EL BACKEND)
  private formatDuration(seconds: number): string {
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

  private processReservationStats(reservas: any[], startDate: string, endDate: string): ReservationStat[] {
    console.log('🔄 Procesando estadísticas de reservas:', reservas.length);

    const statsMap = new Map<string, ReservationStat>();

    // ✅ INCLUIR TODAS LAS FECHAS DEL RANGO, INCLUSO SIN RESERVAS
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      statsMap.set(dateStr, {
        date: dateStr,
        total: 0,
        completed: 0,
        canceled: 0,
        pending: 0
      });
    }

    reservas.forEach(reserva => {
      const date = reserva.fecha;
      if (statsMap.has(date)) {
        const stat = statsMap.get(date)!;
        stat.total++;

        const estado = reserva.estado?.toUpperCase();
        switch (estado) {
          case 'COMPLETADA':
            stat.completed++;
            break;
          case 'CANCELADA':
            stat.canceled++;
            break;
          case 'PENDIENTE_CONFIRMACION':
          case 'CONFIRMADA':
          case 'EN_PLANTA':
          case 'EN_RECEPCION':
            stat.pending++;
            break;
        }
      }
    });

    const resultado = Array.from(statsMap.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log('✅ Estadísticas de reservas procesadas:', resultado.length, 'días');
    return resultado;
  }

  private processAreaStats(reservas: any[], areas: any[]): AreaStat[] {
    console.log('🔄 Procesando estadísticas por área');

    const areaMap = new Map<number, string>();
    areas.forEach(area => areaMap.set(area.id, area.nombre));

    const areaCount = new Map<string, number>();
    const totalReservas = reservas.length;

    reservas.forEach(reserva => {
      if (reserva.areaId) {
        const areaNombre = areaMap.get(reserva.areaId) || 'Área Desconocida';
        areaCount.set(areaNombre, (areaCount.get(areaNombre) || 0) + 1);
      }
    });

    const resultado = Array.from(areaCount.entries()).map(([areaName, total]) => ({
      areaName,
      total,
      percentage: totalReservas > 0 ? (total / totalReservas) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    console.log('✅ Estadísticas por área procesadas:', resultado.length, 'áreas');
    return resultado;
  }

  private processEfficiencyStats(reservas: any[], andenes: any[], areas: any[], startDate: string, endDate: string): EfficiencyStat[] {
    console.log('🔄 Procesando estadísticas de eficiencia');

    const areaMap = new Map<number, string>();
    areas.forEach(area => areaMap.set(area.id, area.nombre));

    const andenStats = new Map<number, {
      andenNumero: number;
      areaName: string;
      reservasCount: number;
      tiempoTotalSegundos: number; // ✅ Cambiar a segundos
    }>();

    andenes.forEach(anden => {
      const areaName = areaMap.get(anden.areaId) || 'Área Desconocida';
      andenStats.set(anden.id, {
        andenNumero: anden.numero,
        areaName,
        reservasCount: 0,
        tiempoTotalSegundos: 0 // ✅ En segundos
      });
    });

    reservas.forEach(reserva => {
      if (reserva.andenId && andenStats.has(reserva.andenId)) {
        const stat = andenStats.get(reserva.andenId)!;
        stat.reservasCount++;

        // Calcular tiempo estimado (diferencia entre hora inicio y fin)
        if (reserva.horaInicio && reserva.horaFin) {
          const inicio = new Date(`2000-01-01T${reserva.horaInicio}`);
          const fin = new Date(`2000-01-01T${reserva.horaFin}`);
          const segundos = (fin.getTime() - inicio.getTime()) / 1000; // ✅ Convertir a segundos
          stat.tiempoTotalSegundos += segundos;
        }
      }
    });

    // ✅ CALCULAR DÍAS EN EL PERÍODO
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diasEnPeriodo = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const resultado: EfficiencyStat[] = Array.from(andenStats.values())
      .filter(stat => stat.reservasCount > 0)
      .map(stat => {
        const tiempoPromedioSegundos = stat.reservasCount > 0 ? stat.tiempoTotalSegundos / stat.reservasCount : 0;
        const utilizacion = Math.min(100, (stat.reservasCount / diasEnPeriodo) * 100);

        return {
          andenNumber: stat.andenNumero,
          areaName: stat.areaName,
          utilizationPercentage: utilizacion,
          averageTimePerReservation: this.formatDuration(tiempoPromedioSegundos), // ✅ Formato legible
          averageTimeInSeconds: Math.round(tiempoPromedioSegundos), // ✅ Para cálculos
          reservationsCount: stat.reservasCount
        };
      })
      .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    console.log('✅ Estadísticas de eficiencia procesadas:', resultado.length, 'andenes');
    return resultado;
  }

  private processProviderStats(reservas: any[], proveedores: any[]): ProviderStat[] {
    console.log('🔄 Procesando estadísticas de proveedores');

    const proveedorMap = new Map<number, string>();
    proveedores.forEach(proveedor => proveedorMap.set(proveedor.id, proveedor.nombre));

    const proveedorStats = new Map<string, {
      count: number;
      completed: number;
      tiempoTotalSegundos: number; // ✅ Cambiar a segundos
    }>();

    reservas.forEach(reserva => {
      const proveedorNombre = proveedorMap.get(reserva.proveedorId) || 'Proveedor Desconocido';

      if (!proveedorStats.has(proveedorNombre)) {
        proveedorStats.set(proveedorNombre, { count: 0, completed: 0, tiempoTotalSegundos: 0 });
      }

      const stat = proveedorStats.get(proveedorNombre)!;
      stat.count++;

      if (reserva.estado?.toUpperCase() === 'COMPLETADA') {
        stat.completed++;
      }

      // Calcular tiempo promedio en segundos
      if (reserva.horaInicio && reserva.horaFin) {
        const inicio = new Date(`2000-01-01T${reserva.horaInicio}`);
        const fin = new Date(`2000-01-01T${reserva.horaFin}`);
        const segundos = (fin.getTime() - inicio.getTime()) / 1000; // ✅ Convertir a segundos
        stat.tiempoTotalSegundos += segundos;
      }
    });

    const resultado: ProviderStat[] = Array.from(proveedorStats.entries())
      .map(([providerName, stat]) => {
        const tiempoPromedioSegundos = stat.count > 0 ? stat.tiempoTotalSegundos / stat.count : 0;

        return {
          providerName,
          reservationsCount: stat.count,
          completedPercentage: stat.count > 0 ? (stat.completed / stat.count) * 100 : 0,
          averageTime: this.formatDuration(tiempoPromedioSegundos), // ✅ Formato legible
          averageTimeInSeconds: Math.round(tiempoPromedioSegundos) // ✅ Para cálculos
        };
      })
      .sort((a, b) => b.reservationsCount - a.reservationsCount);

    console.log('✅ Estadísticas de proveedores procesadas:', resultado.length, 'proveedores');
    return resultado;
  }

  private processReportSummary(reservas: any[], startDate: string, endDate: string): ReportSummary {
    const totalReservations = reservas.length;
    const completedReservations = reservas.filter(r => r.estado?.toUpperCase() === 'COMPLETADA').length;
    const canceledReservations = reservas.filter(r => r.estado?.toUpperCase() === 'CANCELADA').length;
    const pendingReservations = totalReservations - completedReservations - canceledReservations;

    return {
      totalReservations,
      completedReservations,
      canceledReservations,
      pendingReservations,
      completionRate: totalReservations > 0 ? (completedReservations / totalReservations) * 100 : 0,
      cancellationRate: totalReservations > 0 ? (canceledReservations / totalReservations) * 100 : 0,
      period: { startDate, endDate }
    };
  }

  // Exportar reporte a PDF o Excel (placeholder - no implementado en backend)
  exportReport(reportType: string, format: 'pdf' | 'excel', startDate: string, endDate: string): Observable<any> {
    console.log('⚠️ Exportación de reportes no implementada en el backend aún');

    return new Observable(observer => {
      observer.error(new Error('La funcionalidad de exportación no está disponible en este momento'));
    });
  }
}

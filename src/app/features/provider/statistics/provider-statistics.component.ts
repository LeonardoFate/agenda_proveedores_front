// src/app/features/provider/statistics/provider-statistics.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService, ProviderStatistics } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-provider-statistics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="bg-gray-50 min-h-screen p-6">
      <div class="bg-white shadow-md rounded-lg p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Mis Estadísticas</h1>
            <p class="text-gray-600">Análisis de rendimiento y actividad</p>
          </div>
          <div>
            <a routerLink="/provider/dashboard" class="text-primary-600 hover:text-primary-700 flex items-center">
              <svg class="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
              </svg>
              Volver al dashboard
            </a>
          </div>
        </div>
      </div>

      <!-- Filtros de fecha -->
      <div class="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">Período de Análisis</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="fechaInicio" class="block text-sm font-medium text-gray-700">Fecha de inicio</label>
            <input
              type="date"
              id="fechaInicio"
              [(ngModel)]="fechaInicio"
              (change)="loadStatistics()"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
          </div>
          <div>
            <label for="fechaFin" class="block text-sm font-medium text-gray-700">Fecha de fin</label>
            <input
              type="date"
              id="fechaFin"
              [(ngModel)]="fechaFin"
              (change)="loadStatistics()"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
          </div>
          <div class="flex items-end">
            <button
              (click)="setQuickPeriod('lastMonth')"
              class="mr-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Último mes
            </button>
            <button
              (click)="setQuickPeriod('last3Months')"
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Últimos 3 meses
            </button>
          </div>
        </div>
      </div>

      <!-- Loader -->
      <div *ngIf="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>

      <!-- Mensajes de error -->
      <div *ngIf="errorMessage" class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Estadísticas principales -->
      <div *ngIf="!loading && statistics" class="space-y-6">
        <!-- Resumen general -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Resumen General</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-primary-600">{{ statistics.totalReservas }}</div>
              <div class="text-sm text-gray-500">Total Reservas</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600">{{ statistics.completadas }}</div>
              <div class="text-sm text-gray-500">Completadas</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600">{{ statistics.confirmadas }}</div>
              <div class="text-sm text-gray-500">Confirmadas</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-red-600">{{ statistics.canceladas }}</div>
              <div class="text-sm text-gray-500">Canceladas</div>
            </div>
          </div>
        </div>

        <!-- Distribución por estado -->
        <div class="bg-white shadow-md rounded-lg p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Distribución por Estado</h2>
          <div class="space-y-3">
            <div *ngFor="let item of getDistributionArray()" class="flex items-center">
              <div class="w-24 text-sm font-medium text-gray-700">{{ getStatusDisplayName(item.estado) }}</div>
              <div class="flex-1 mx-4">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full"
                    [style.width.%]="getPercentage(item.count)"
                    [ngClass]="getStatusBarColor(item.estado)"
                  ></div>
                </div>
              </div>
              <div class="w-16 text-sm text-gray-600 text-right">{{ item.count }} ({{ getPercentage(item.count) | number:'1.0-1' }}%)</div>
            </div>
          </div>
        </div>

        <!-- Información del período -->
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                <strong>Período consultado:</strong> {{ formatDate(statistics.periodoConsultado.fechaInicio) }} - {{ formatDate(statistics.periodoConsultado.fechaFin) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado sin datos -->
      <div *ngIf="!loading && !statistics" class="bg-white shadow-md rounded-lg p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No hay estadísticas</h3>
        <p class="mt-1 text-sm text-gray-500">No se encontraron datos para el período seleccionado.</p>
      </div>
    </div>
  `
})
export class ProviderStatisticsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  statistics: ProviderStatistics | null = null;
  loading = false;
  errorMessage = '';
  fechaInicio = '';
  fechaFin = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private providerService: ProviderService
  ) {
    // Establecer fechas por defecto (último mes)
    this.setQuickPeriod('lastMonth');
  }

  ngOnInit(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadStatistics();
      }
    });

    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setQuickPeriod(period: 'lastMonth' | 'last3Months'): void {
    const today = new Date();
    this.fechaFin = today.toISOString().split('T')[0];

    const startDate = new Date();
    if (period === 'lastMonth') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'last3Months') {
      startDate.setMonth(startDate.getMonth() - 3);
    }
    this.fechaInicio = startDate.toISOString().split('T')[0];

    this.loadStatistics();
  }

  loadStatistics(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const statsSub = this.providerService.getMyStatistics(this.fechaInicio, this.fechaFin)
      .pipe(
        catchError(error => {
          console.error('Error al cargar estadísticas:', error);
          this.errorMessage = 'Error al cargar las estadísticas.';
          this.loading = false;
          throw error;
        })
      )
      .subscribe({
        next: (data) => {
          this.statistics = data;
          this.loading = false;
        },
        error: () => {
          // Error ya manejado en catchError
        }
      });

    this.subscriptions.push(statsSub);
  }

  getDistributionArray(): Array<{estado: string, count: number}> {
    if (!this.statistics?.distribucionPorEstado) return [];

    return Object.entries(this.statistics.distribucionPorEstado)
      .map(([estado, count]) => ({ estado, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }

  getPercentage(count: number): number {
    if (!this.statistics?.totalReservas || this.statistics.totalReservas === 0) return 0;
    return (count / this.statistics.totalReservas) * 100;
  }

  getStatusDisplayName(status: string): string {
    const statusNames: { [key: string]: string } = {
      'PENDIENTE_CONFIRMACION': 'Pend. Conf.',
      'CONFIRMADA': 'Confirmada',
      'PENDIENTE': 'Pendiente',
      'EN_PLANTA': 'En Planta',
      'EN_RECEPCION': 'En Recep.',
      'COMPLETADA': 'Completada',
      'CANCELADA': 'Cancelada'
    };
    return statusNames[status] || status;
  }

  getStatusBarColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PENDIENTE_CONFIRMACION': 'bg-orange-500',
      'CONFIRMADA': 'bg-blue-500',
      'PENDIENTE': 'bg-yellow-500',
      'EN_PLANTA': 'bg-indigo-500',
      'EN_RECEPCION': 'bg-purple-500',
      'COMPLETADA': 'bg-green-500',
      'CANCELADA': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }
}

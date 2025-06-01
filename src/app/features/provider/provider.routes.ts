// src/app/features/provider/provider.routes.ts - COMPLETO ACTUALIZADO
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PROVIDER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./provider-dashboard.component').then(m => m.ProviderDashboardComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR' }
  },
  {
    path: 'schedule',
    loadComponent: () =>
      import('./schedule/schedule-template-selection.component').then(m => m.ScheduleTemplateSelectionComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR' }
  },
  {
    path: 'confirm-reservation',
    loadComponent: () =>
      import('./schedule/confirm-reservation.component').then(m => m.ConfirmReservationComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR' }
  },
//   {
//     path: 'my-reservations',
//     loadComponent: () =>
//       import('./reservations/my-reservations.component').then(m => m.MyReservationsComponent),
//     canActivate: [authGuard],
//     data: { requiredRole: 'PROVEEDOR' }
//   },
//   {
//     path: 'reservation/:id',
//     loadComponent: () =>
//       import('./reservations/reservation-detail.component').then(m => m.ReservationDetailComponent),
//     canActivate: [authGuard],
//     data: { requiredRole: 'PROVEEDOR' }
//   },
  {
    path: 'statistics',
    loadComponent: () =>
      import('./statistics/provider-statistics.component').then(m => m.ProviderStatisticsComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR' }
  }
];

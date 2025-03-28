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
    loadComponent: () => import('./provider-dashboard.component').then(m => m.ProviderDashboardComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR' }
  },
   {
    path: 'schedule',
    loadComponent: () => import('./schedule/schedule-reservation.component').then(m => m.ScheduleReservationComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR' }
  },
  {
    path: 'my-reservations',
    loadComponent: () => import('./reservations/my-reservations.component').then(m => m.MyReservationsComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR' }
  },
  {
    path: 'reservation/:id',
    loadComponent: () => import('./reservations/reservation-detail.component').then(m => m.ReservationDetailComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR' }
  },
  {
    path: 'edit-reservation/:id',
    loadComponent: () => import('./schedule/schedule-reservation.component').then(m => m.ScheduleReservationComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'PROVEEDOR', isEditing: true }
  },
//   {
//     path: 'profile',
//     loadComponent: () => import('./profile/provider-profile.component').then(m => m.ProviderProfileComponent),
//     canActivate: [authGuard],
//     data: { requiredRole: 'PROVEEDOR' }
//   }
];

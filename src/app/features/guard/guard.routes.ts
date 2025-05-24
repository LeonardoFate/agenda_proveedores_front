import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const GUARD_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
//   {
//     path: 'dashboard',
//     loadComponent: () => import('./dashboard/guard-dashboard.component').then(m => m.GuardDashboardComponent),
//     canActivate: [authGuard],
//     data: { requiredRole: 'GUARDIA' }
//   },
//   {
//     path: 'reservations',
//     loadComponent: () => import('./reservations/reservation-list.component').then(m => m.ReservationListComponent),
//     canActivate: [authGuard],
//     data: { requiredRole: 'GUARDIA' }
//   },
//   {
//     path: 'entries',
//     loadComponent: () => import('./entries/entry-management.component').then(m => m.EntryManagementComponent),
//     canActivate: [authGuard],
//     data: { requiredRole: 'GUARDIA' }
//   },
//   {
//     path: 'entry/:id',
//     loadComponent: () => import('./entries/entry-detail.component').then(m => m.EntryDetailComponent),
//     canActivate: [authGuard],
//     data: { requiredRole: 'GUARDIA' }
//   }
];

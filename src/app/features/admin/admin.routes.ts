import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-list.component').then(m => m.UserListComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
  {
    path: 'users/create',
    loadComponent: () => import('./users/user-form.component').then(m => m.UserFormComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
  {
    path: 'users/edit/:id',
    loadComponent: () => import('./users/user-form.component').then(m => m.UserFormComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
  {
    path: 'areas',
    loadComponent: () => import('./areas/area-list.component').then(m => m.AreaListComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
  {
    path: 'areas/create',
    loadComponent: () => import('./areas/area-form.component').then(m => m.AreaFormComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
  {
    path: 'areas/edit/:id',
    loadComponent: () => import('./areas/area-form.component').then(m => m.AreaFormComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
  {
    path: 'areas/create-anden/:areaId',
    loadComponent: () => import('./areas/anden-form.component').then(m => m.AndenFormComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
  {
    path: 'areas/edit-anden/:id',
    loadComponent: () => import('./areas/anden-form.component').then(m => m.AndenFormComponent),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  }
//   {
//     path: 'reports',
//     loadComponent: () => import('./reports/report-dashboard.component').then(m => m.ReportDashboardComponent),
//     canActivate: [authGuard],
//     data: { requiredRole: 'ADMIN' }
//   }
];

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard],
    data: { requiredRole: 'ADMIN' }
  },
//   {
//     path: 'agent',
//     loadChildren: () => import('./features/agent/agent.routes').then(m => m.AGENT_ROUTES),
//     canActivate: [authGuard],
//     data: { requiredRole: 'AGENTE' }
//   },
//   {
//     path: 'guard',
//     loadChildren: () => import('./features/guard/guard.routes').then(m => m.GUARD_ROUTES),
//     canActivate: [authGuard],
//     data: { requiredRole: 'GUARDIA' }
//   },
//   {
//     path: 'provider',
//     loadChildren: () => import('./features/provider/provider.routes').then(m => m.PROVIDER_ROUTES),
//     canActivate: [authGuard],
//     data: { requiredRole: 'PROVEEDOR' }
//   },
//   {
//     path: '**',
//     loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
//   }
];

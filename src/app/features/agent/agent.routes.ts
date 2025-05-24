import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';



export const AGENT_ROUTES: Routes = [
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full'
    },
    // {
    //   path: 'dashboard',
    //   loadComponent: () => import('./dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent),
    //   canActivate: [authGuard],
    //   data: { requiredRole: 'AGENTE' }
    // },
    {
        path: 'docks',
        loadComponent: () => import('./docks/docks-management.component').then(m => m.DocksManagementComponent),
        canActivate: [authGuard],
        data: { requiredRole: 'AGENTE' }
      },
    //   {
    //     path: 'receptions',
    //     loadComponent: () => import('./receptions/receptions-list.component').then(m => m.ReceptionsListComponent),
    //     canActivate: [authGuard],
    //     data: { requiredRole: 'AGENTE' }
    //   },
    //   {
    //     path: 'reception/:id',
    //     loadComponent: () => import('./receptions/reception-detail/reception-detail.component').then(m => m.ReceptionDetailComponent),
    //     canActivate: [authGuard],
    //     data: { requiredRole: 'AGENTE' }
    //   }
    ];

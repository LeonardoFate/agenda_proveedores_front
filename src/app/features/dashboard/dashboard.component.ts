import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;
  currentDate = new Date();

  // Estadísticas ficticias para demostración
  stats = {
    totalReservations: 0,
    pendingReservations: 0,
    completedReservations: 0,
    inProgressReservations: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loading = false;

      // Cargar estadísticas según el rol (valores ficticios para demostración)
      this.loadStatsByRole();
    });
  }

  loadStatsByRole(): void {
    if (!this.currentUser) return;

    switch (this.currentUser.rol) {
      case 'ADMIN':
        this.stats = {
          totalReservations: 245,
          pendingReservations: 58,
          completedReservations: 178,
          inProgressReservations: 9
        };
        break;
      case 'GUARDIA':
        this.stats = {
          totalReservations: 32,
          pendingReservations: 12,
          completedReservations: 15,
          inProgressReservations: 5
        };
        break;
      case 'AGENTE':
        this.stats = {
          totalReservations: 47,
          pendingReservations: 0,
          completedReservations: 42,
          inProgressReservations: 5
        };
        break;
      case 'PROVEEDOR':
        this.stats = {
          totalReservations: 12,
          pendingReservations: 3,
          completedReservations: 9,
          inProgressReservations: 0
        };
        break;
    }
  }

  getRoleName(rol: string): string {
    switch (rol) {
      case 'ADMIN': return 'Administrador';
      case 'GUARDIA': return 'Guardia';
      case 'AGENTE': return 'Agente';
      case 'PROVEEDOR': return 'Proveedor';
      default: return 'Usuario';
    }
  }

  getModuleRoutes(): {title: string, description: string, icon: string, route: string}[] {
    if (!this.currentUser) return [];

    switch (this.currentUser.rol) {
      case 'ADMIN':
        return [
          {
            title: 'Usuarios',
            description: 'Gestión de usuarios del sistema',
            icon: 'users',
            route: '/admin/users'
          },
          {
            title: 'Áreas',
            description: 'Gestión de áreas y andenes',
            icon: 'office',
            route: '/admin/areas'
          },
          {
            title: 'Reportes',
            description: 'Estadísticas y reportes del sistema',
            icon: 'chart',
            route: '/admin/reports'
          }
        ];
      case 'GUARDIA':
        return [
          {
            title: 'Reservas',
            description: 'Ver reservas programadas',
            icon: 'calendar',
            route: '/guard/reservations'
          },
          {
            title: 'Entradas/Salidas',
            description: 'Registro de ingresos y salidas',
            icon: 'truck',
            route: '/guard/entries'
          }
        ];
      case 'AGENTE':
        return [
          {
            title: 'Andenes',
            description: 'Estado de andenes asignados',
            icon: 'dock',
            route: '/agent/docks'
          },
          {
            title: 'Recepciones',
            description: 'Gestión de recepciones',
            icon: 'clipboard',
            route: '/agent/receptions'
          }
        ];
      case 'PROVEEDOR':
        return [
          {
            title: 'Agendar',
            description: 'Crear una nueva reserva',
            icon: 'calendar-plus',
            route: '/provider/schedule'
          },
          {
            title: 'Mis Reservas',
            description: 'Ver historial de reservas',
            icon: 'list',
            route: '/provider/my-reservations'
          }
        ];
      default:
        return [];
    }
  }

  getIconClass(iconName: string): string {
    switch (iconName) {
      case 'users': return 'fas fa-users';
      case 'office': return 'fas fa-building';
      case 'chart': return 'fas fa-chart-bar';
      case 'calendar': return 'fas fa-calendar-alt';
      case 'truck': return 'fas fa-truck';
      case 'dock': return 'fas fa-warehouse';
      case 'clipboard': return 'fas fa-clipboard-list';
      case 'calendar-plus': return 'fas fa-calendar-plus';
      case 'list': return 'fas fa-list';
      default: return 'fas fa-circle';
    }
  }
}

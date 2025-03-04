import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isMenuOpen = false;
  isUserMenuOpen = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isUserMenuOpen = false;
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }

  closeMenus(): void {
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
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

  getDashboardLink(): string {
    if (!this.currentUser) return '/login';

    switch (this.currentUser.rol) {
      case 'ADMIN': return '/admin/dashboard';
      case 'GUARDIA': return '/guard/dashboard';
      case 'AGENTE': return '/agent/dashboard';
      case 'PROVEEDOR': return '/provider/dashboard';
      default: return '/dashboard';
    }
  }
}

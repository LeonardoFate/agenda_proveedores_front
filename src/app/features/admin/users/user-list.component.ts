import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearchTerm = !this.searchTerm ||
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.apellido.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRoleFilter = !this.roleFilter || user.rol === this.roleFilter;

      const matchesStatusFilter = this.statusFilter === '' ||
        (this.statusFilter === 'active' && user.estado) ||
        (this.statusFilter === 'inactive' && !user.estado);

      return matchesSearchTerm && matchesRoleFilter && matchesStatusFilter;
    });
  }

  changeUserStatus(userId: number, newStatus: boolean): void {
    this.userService.changeUserStatus(userId, newStatus).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) {
          user.estado = newStatus;
        }
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error changing user status', error);
      }
    });
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
}

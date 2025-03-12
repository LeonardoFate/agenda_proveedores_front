// src/app/features/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { AreaService } from '../../../core/services/area.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  stats = {
    totalUsers: 0,
    totalAreas: 0,
    totalAndenes: 0,
    activeUsers: 0,
    guardUsers: 0,
    agentUsers: 0,
    providerUsers: 0
  };

  constructor(
    private userService: UserService,
    private areaService: AreaService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    Promise.all([
      this.userService.getUsers().toPromise(),
      this.areaService.getAreas().toPromise(),
      this.areaService.getAndenes().toPromise()
    ]).then(([users, areas, andenes]) => {
      if (users) {
        this.stats.totalUsers = users.length;
        this.stats.activeUsers = users.filter(u => u.estado).length;
        this.stats.guardUsers = users.filter(u => u.rol === 'GUARDIA').length;
        this.stats.agentUsers = users.filter(u => u.rol === 'AGENTE').length;
        this.stats.providerUsers = users.filter(u => u.rol === 'PROVEEDOR').length;
      }

      if (areas) {
        this.stats.totalAreas = areas.length;
      }

      if (andenes) {
        this.stats.totalAndenes = andenes.length;
      }

      this.loading = false;
    }).catch(error => {
      console.error('Error loading admin stats', error);
      this.loading = false;
    });
  }
}

// src/app/features/agent/docks/docks-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AreaService } from '../../../core/services/area.service';
import { Anden, EstadoAnden } from '../../../core/models/anden.model';

@Component({
  selector: 'app-docks-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './docks-management.component.html'
})
export class DocksManagementComponent implements OnInit {
  andenes: Anden[] = [];
  areas: any[] = [];
  loading = false;
  areaFilter = '';
  estadoFilter = '';
  successMessage = '';
  errorMessage = '';

  estados = Object.values(EstadoAnden);

  constructor(private areaService: AreaService) {}

  ngOnInit(): void {
    this.loadAreas();
    this.loadAndenes();
  }

  loadAreas(): void {
    this.areaService.getAreas().subscribe({
      next: (data) => {
        this.areas = data;
      },
      error: (error) => {
        console.error('Error cargando áreas', error);
      }
    });
  }

  loadAndenes(): void {
    this.loading = true;
    this.areaService.getAndenes().subscribe({
      next: (data) => {
        this.andenes = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando andenes', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadAndenes();
  }

  updateAndenStatus(andenId: number, newStatus: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Convertir el string a enum si es necesario
    const estadoEnum = newStatus as EstadoAnden;

    this.areaService.updateAndenStatus(andenId, estadoEnum).subscribe({
      next: (updatedAnden) => {
        // Actualizar el andén en la lista local
        const index = this.andenes.findIndex(a => a.id === andenId);
        if (index !== -1) {
          this.andenes[index] = updatedAnden;
        }
        this.successMessage = `Andén actualizado correctamente a: ${newStatus}`;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al actualizar andén', error);
        this.errorMessage = 'Ocurrió un error al actualizar el estado del andén';
        this.loading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DISPONIBLE': return 'bg-green-100 text-green-800';
      case 'OCUPADO': return 'bg-red-100 text-red-800';
      case 'ALMUERZO': return 'bg-yellow-100 text-yellow-800';
      case 'DESCANSO': return 'bg-blue-100 text-blue-800';
      case 'NO_DISPONIBLE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getFilteredAndenes(): Anden[] {
    return this.andenes.filter(anden => {
      const matchesArea = !this.areaFilter || anden.areaId === +this.areaFilter;
      const matchesEstado = !this.estadoFilter || anden.estado === this.estadoFilter;
      return matchesArea && matchesEstado;
    });
  }

  getAreaName(areaId: number): string {
    const area = this.areas.find(a => a.id === areaId);
    return area ? area.nombre : 'Desconocida';
  }
}

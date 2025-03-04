import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AreaService } from '../../../core/services/area.service';
import { Area } from '../../../core/models/area.model';
import { Anden } from '../../../core/models/anden.model';

@Component({
  selector: 'app-area-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './area-list.component.html',
  styleUrls: ['./area-list.component.scss']
})
export class AreaListComponent implements OnInit {
  areas: Area[] = [];
  andenes: Anden[] = [];
  expandedAreaId: number | null = null;
  loading = true;
  searchTerm = '';

  constructor(private areaService: AreaService) {}

  ngOnInit(): void {
    this.loadAreas();
    this.loadAndenes();
  }

  loadAreas(): void {
    this.areaService.getAreas().subscribe({
      next: (data) => {
        this.areas = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading areas', error);
        this.loading = false;
      }
    });
  }

  loadAndenes(): void {
    this.areaService.getAndenes().subscribe({
      next: (data) => {
        this.andenes = data;
      },
      error: (error) => {
        console.error('Error loading andenes', error);
      }
    });
  }

  toggleAreaExpansion(areaId: number): void {
    if (this.expandedAreaId === areaId) {
      this.expandedAreaId = null;
    } else {
      this.expandedAreaId = areaId;
    }
  }

  getAndenesByArea(areaId: number): Anden[] {
    return this.andenes.filter(anden => anden.areaId === areaId);
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'DISPONIBLE': return 'bg-green-100 text-green-800';
      case 'OCUPADO': return 'bg-red-100 text-red-800';
      case 'ALMUERZO': return 'bg-yellow-100 text-yellow-800';
      case 'DESCANSO': return 'bg-blue-100 text-blue-800';
      case 'NO_DISPONIBLE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  deleteArea(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Está seguro de eliminar esta área? Se eliminarán también todos los andenes asociados.')) {
      this.areaService.deleteArea(id).subscribe({
        next: () => {
          this.areas = this.areas.filter(area => area.id !== id);
          this.andenes = this.andenes.filter(anden => anden.areaId !== id);
        },
        error: (error) => {
          console.error('Error deleting area', error);
          alert('No se pudo eliminar el área. Verifica que no tenga reservas asociadas.');
        }
      });
    }
  }

  deleteAnden(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Está seguro de eliminar este andén?')) {
      this.areaService.deleteAnden(id).subscribe({
        next: () => {
          this.andenes = this.andenes.filter(anden => anden.id !== id);
        },
        error: (error) => {
          console.error('Error deleting anden', error);
          alert('No se pudo eliminar el andén. Verifica que no tenga reservas asociadas.');
        }
      });
    }
  }

  filteredAreas(): Area[] {
    if (!this.searchTerm) return this.areas;

    return this.areas.filter(area =>
      area.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      area.descripcion?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}

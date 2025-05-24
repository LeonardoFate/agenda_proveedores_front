import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScheduleTemplateService, HorarioPlantilla } from '../../../core/services/schedule-template.service';
import { AreaService } from '../../../core/services/area.service';

@Component({
  selector: 'app-schedule-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './schedule-template.component.html'
})
export class ScheduleTemplateComponent implements OnInit {
  templateForm: FormGroup;
  plantillas: HorarioPlantilla[] = [];
  areas: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  isEditing = false;
  currentTemplateId: number | null = null;

  diasSemana = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

  constructor(
    private fb: FormBuilder,
    private scheduleTemplateService: ScheduleTemplateService,
    private areaService: AreaService
  ) {
    this.templateForm = this.fb.group({
      areaId: ['', Validators.required],
      diaSemana: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      esActivo: [true]
    });
  }

  ngOnInit(): void {
    this.loadAreas();
    this.loadPlantillas();
  }

  loadAreas(): void {
    this.areaService.getAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
      },
      error: (error) => {
        console.error('Error loading areas', error);
        this.errorMessage = 'Error al cargar las áreas.';
      }
    });
  }

  loadPlantillas(): void {
    this.loading = true;
    this.scheduleTemplateService.getHorariosPlantilla(0) // 0 para obtener todos
      .subscribe({
        next: (plantillas) => {
          this.plantillas = plantillas;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading templates', error);
          this.errorMessage = 'Error al cargar las plantillas de horario.';
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.templateForm.valid) {
      this.loading = true;

      if (this.isEditing && this.currentTemplateId) {
        this.scheduleTemplateService.actualizarHorarioPlantilla(
          this.currentTemplateId,
          this.templateForm.value
        ).subscribe({
          next: () => {
            this.successMessage = 'Plantilla actualizada exitosamente.';
            this.resetForm();
            this.loadPlantillas();
          },
          error: (error) => {
            console.error('Error updating template', error);
            this.errorMessage = 'Error al actualizar la plantilla.';
            this.loading = false;
          }
        });
      } else {
        this.scheduleTemplateService.crearHorarioPlantilla(this.templateForm.value)
          .subscribe({
            next: () => {
              this.successMessage = 'Plantilla creada exitosamente.';
              this.resetForm();
              this.loadPlantillas();
            },
            error: (error) => {
              console.error('Error creating template', error);
              this.errorMessage = 'Error al crear la plantilla.';
              this.loading = false;
            }
          });
      }
    } else {
      this.markFormGroupTouched(this.templateForm);
    }
  }

  editPlantilla(plantilla: HorarioPlantilla): void {
    this.isEditing = true;
    this.currentTemplateId = plantilla.id;
    this.templateForm.patchValue(plantilla);
  }

  deletePlantilla(id: number): void {
    if (confirm('¿Está seguro de eliminar esta plantilla de horario?')) {
      this.loading = true;
      this.scheduleTemplateService.eliminarHorarioPlantilla(id).subscribe({
        next: () => {
          this.successMessage = 'Plantilla eliminada exitosamente.';
          this.loadPlantillas();
        },
        error: (error) => {
          console.error('Error deleting template', error);
          this.errorMessage = 'Error al eliminar la plantilla.';
          this.loading = false;
        }
      });
    }
  }

  resetForm(): void {
    this.templateForm.reset();
    this.templateForm.patchValue({ esActivo: true });
    this.isEditing = false;
    this.currentTemplateId = null;
    this.loading = false;
  }

  // Método auxiliar para marcar todos los campos como tocados
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }
  getAreaName(areaId: number): string {
    const area = this.areas.find(a => a.id === areaId);
    return area ? area.nombre : 'Área desconocida';
  }

}

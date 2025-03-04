// src/app/features/admin/areas/anden-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AreaService } from '../../../core/services/area.service';
import { Area } from '../../../core/models/area.model';
import { EstadoAnden } from '../../../core/models/anden.model';

@Component({
  selector: 'app-anden-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './anden-form.component.html',
})
export class AndenFormComponent implements OnInit {
  andenForm: FormGroup;
  isEditing = false;
  andenId: number | null = null;
  areaId: number | null = null;
  area: Area | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';
  estadosAnden = Object.values(EstadoAnden);

  constructor(
    private fb: FormBuilder,
    private areaService: AreaService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.andenForm = this.fb.group({
      areaId: ['', [Validators.required]],
      numero: ['', [Validators.required, Validators.min(1)]],
      estado: ['DISPONIBLE', [Validators.required]],
      capacidad: [''],
      exclusivoContenedor: [false]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const areaId = this.route.snapshot.paramMap.get('areaId');

    if (id) {
      // Modo edición
      this.isEditing = true;
      this.andenId = +id;
      this.loadAnden(this.andenId);
    } else if (areaId) {
      // Modo creación con área predefinida
      this.areaId = +areaId;
      this.andenForm.patchValue({ areaId: this.areaId });
      this.loadArea(this.areaId);
    }
  }

  loadAnden(id: number): void {
    this.loading = true;
    this.areaService.getAndenById(id).subscribe({
      next: (anden) => {
        this.andenForm.patchValue({
          areaId: anden.areaId,
          numero: anden.numero,
          estado: anden.estado,
          capacidad: anden.capacidad,
          exclusivoContenedor: anden.exclusivoContenedor
        });
        this.areaId = anden.areaId;
        this.loadArea(anden.areaId);
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los datos del andén.';
        console.error('Error loading anden', error);
        this.loading = false;
      }
    });
  }

  loadArea(id: number): void {
    this.areaService.getAreaById(id).subscribe({
      next: (area) => {
        this.area = area;
      },
      error: (error) => {
        console.error('Error loading area', error);
      }
    });
  }

  onSubmit(): void {
    if (this.andenForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      if (this.isEditing && this.andenId) {
        this.areaService.updateAnden(this.andenId, this.andenForm.value).subscribe({
          next: () => {
            this.successMessage = 'Andén actualizado exitosamente.';
            this.loading = false;
            setTimeout(() => {
              this.router.navigate(['/admin/areas']);
            }, 1500);
          },
          error: (error) => {
            this.handleError(error);
          }
        });
      } else {
        this.areaService.createAnden(this.andenForm.value).subscribe({
          next: () => {
            this.successMessage = 'Andén creado exitosamente.';
            this.loading = false;
            setTimeout(() => {
              this.router.navigate(['/admin/areas']);
            }, 1500);
          },
          error: (error) => {
            this.handleError(error);
          }
        });
      }
    } else {
      // Marcar todos los campos como tocados para mostrar las validaciones
      Object.keys(this.andenForm.controls).forEach(key => {
        this.andenForm.get(key)?.markAsTouched();
      });
    }
  }

  handleError(error: any): void {
    this.loading = false;
    if (error.status === 409) {
      this.errorMessage = 'Ya existe un andén con este número en esta área.';
    } else {
      this.errorMessage = error.error?.mensaje || 'Error al procesar la solicitud.';
    }
    console.error('Error submitting form', error);
  }

  getControlError(controlName: string): string {
    const control = this.andenForm.get(controlName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Este campo es obligatorio.';
      }
      if (control.errors?.['min']) {
        return 'El valor debe ser mayor o igual a 1.';
      }
    }
    return '';
  }

  cancelForm(): void {
    this.router.navigate(['/admin/areas']);
  }
}

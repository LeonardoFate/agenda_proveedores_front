import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AreaService } from '../../../core/services/area.service';

@Component({
  selector: 'app-area-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './area-form.component.html',
})
export class AreaFormComponent implements OnInit {
  areaForm: FormGroup;
  isEditing = false;
  areaId: number | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private areaService: AreaService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.areaForm = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.areaId = +id;
      this.loadArea(this.areaId);
    }
  }

  loadArea(id: number): void {
    this.loading = true;
    this.areaService.getAreaById(id).subscribe({
      next: (area) => {
        this.areaForm.patchValue({
          nombre: area.nombre,
          descripcion: area.descripcion
        });
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los datos del área.';
        console.error('Error loading area', error);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.areaForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      if (this.isEditing && this.areaId) {
        this.areaService.updateArea(this.areaId, this.areaForm.value).subscribe({
          next: () => {
            this.successMessage = 'Área actualizada exitosamente.';
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
        this.areaService.createArea(this.areaForm.value).subscribe({
          next: () => {
            this.successMessage = 'Área creada exitosamente.';
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
      Object.keys(this.areaForm.controls).forEach(key => {
        this.areaForm.get(key)?.markAsTouched();
      });
    }
  }

  handleError(error: any): void {
    this.loading = false;
    if (error.status === 409) {
      this.errorMessage = 'Ya existe un área con este nombre.';
    } else {
      this.errorMessage = error.error?.mensaje || 'Error al procesar la solicitud.';
    }
    console.error('Error submitting form', error);
  }

  getControlError(controlName: string): string {
    const control = this.areaForm.get(controlName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Este campo es obligatorio.';
      }
    }
    return '';
  }

  cancelForm(): void {
    this.router.navigate(['/admin/areas']);
  }
}

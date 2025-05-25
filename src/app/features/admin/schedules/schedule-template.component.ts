// =====================================================================
// schedule-template.component.ts - COMPONENTE COMPLETO
// =====================================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AreaService } from '../../../core/services/area.service';
import { ProviderService } from '../../../core/services/provider.service';
import { PlantillaHorario, DiaSemana } from '../../../core/models/plantilla-horario.model';
import { Area } from '../../../core/models/area.model';
import { Proveedor } from '../../../core/models/proveedor.model';

@Component({
  selector: 'app-schedule-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './schedule-template.component.html'
})
export class ScheduleTemplateComponent implements OnInit {
  templateForm: FormGroup;
  plantillas: any[] = [];
  areas: Area[] = [];
  proveedores: any[] = [];

  loading = false;
  uploadLoading = false;
  errorMessage = '';
  successMessage = '';
  isEditing = false;
  currentTemplateId: number | null = null;

  // Propiedades para carga de Excel
  selectedFile: File | null = null;
  previewData: any[] = [];
  showPreview = false;

  // ✅ NUEVAS PROPIEDADES para selección múltiple
  selectedPlantillas: number[] = [];
  selectAll: boolean = false;
  showDeleteButton: boolean = false;

  diasSemana = Object.values(DiaSemana);

  constructor(
    private fb: FormBuilder,
    private areaService: AreaService,
    private providerService: ProviderService
  ) {
    this.templateForm = this.fb.group({
      dia: ['', Validators.required],
      proveedorId: ['', Validators.required],
      numeroPersonas: ['', [Validators.required, Validators.min(1)]],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      tiempoDescarga: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadAreas();
    this.loadProveedores();
    this.loadPlantillas();
  }

  // =====================================================================
  // MÉTODOS DE CARGA DE DATOS
  // =====================================================================

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

  loadProveedores(): void {
    this.providerService.getProveedores().subscribe({
      next: (proveedores: any) => {
        this.proveedores = proveedores;
      },
      error: (error: any) => {
        console.error('Error loading proveedores', error);
        this.errorMessage = 'Error al cargar los proveedores.';
      }
    });
  }

  loadPlantillas(): void {
    this.loading = true;
    this.providerService.getPlantillasHorario().subscribe({
      next: (plantillas: any) => {
        this.plantillas = plantillas;
        this.loading = false;

        // ✅ Limpiar selección al recargar
        this.clearSelection();
      },
      error: (error: any) => {
        console.error('Error loading templates', error);
        this.errorMessage = 'Error al cargar las plantillas de horario.';
        this.loading = false;
      }
    });
  }

  // =====================================================================
  // MÉTODOS PARA UPLOAD DE EXCEL
  // =====================================================================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.validateExcelFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.validateExcelFile(files[0]);
    }
  }

  validateExcelFile(file: File): void {
    // Validar tipo de archivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)';
      this.selectedFile = null;
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'El archivo es demasiado grande. Máximo 10MB permitido.';
      this.selectedFile = null;
      return;
    }

    this.errorMessage = '';
    this.successMessage = `Archivo seleccionado: ${file.name}`;
  }

  uploadExcel(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Por favor seleccione un archivo Excel.';
      return;
    }

    this.uploadLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.providerService.uploadPlantillaExcel(this.selectedFile).subscribe({
      next: (response: any) => {
        this.successMessage = `${response.plantillasCargadas} plantillas cargadas exitosamente.`;
        this.previewData = response.plantillas;
        this.showPreview = true;
        this.selectedFile = null;
        this.loadPlantillas();
        this.uploadLoading = false;

        // Limpiar input file
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (error) => {
        console.error('Error uploading Excel', error);
        this.errorMessage = error.error?.detalle || 'Error al procesar el archivo Excel.';
        this.uploadLoading = false;
      }
    });
  }

  closePreview(): void {
    this.showPreview = false;
    this.previewData = [];
  }

  // =====================================================================
  // MÉTODOS CRUD PARA PLANTILLAS INDIVIDUALES
  // =====================================================================

  onSubmit(): void {
    if (this.templateForm.valid) {
      this.loading = true;

      if (this.isEditing && this.currentTemplateId) {
        this.providerService.updatePlantillaHorario(
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
        this.providerService.createPlantillaHorario(this.templateForm.value).subscribe({
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

  editPlantilla(plantilla: any): void {
    this.isEditing = true;
    this.currentTemplateId = plantilla.id!;
    this.templateForm.patchValue({
      dia: plantilla.dia,
      proveedorId: plantilla.proveedorId,
      numeroPersonas: plantilla.numeroPersonas,
      horaInicio: plantilla.horaInicio,
      horaFin: plantilla.horaFin,
      tiempoDescarga: plantilla.tiempoDescarga,
      activo: plantilla.activo
    });

    // Scroll al formulario
    document.querySelector('.bg-white')?.scrollIntoView({ behavior: 'smooth' });
  }

  deletePlantilla(id: number): void {
    if (confirm('¿Está seguro de eliminar esta plantilla de horario?')) {
      this.loading = true;
      this.providerService.deletePlantillaHorario(id).subscribe({
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
    this.templateForm.patchValue({ activo: true });
    this.isEditing = false;
    this.currentTemplateId = null;
    this.loading = false;

    // Limpiar selección al resetear
    this.clearSelection();
  }

  // =====================================================================
  // ✅ NUEVOS MÉTODOS PARA SELECCIÓN Y ELIMINACIÓN MÚLTIPLE
  // =====================================================================

  /**
   * Seleccionar/deseleccionar una plantilla individual
   */
  onPlantillaSelect(plantillaId: number, checked: boolean): void {
    if (checked) {
      this.selectedPlantillas.push(plantillaId);
    } else {
      this.selectedPlantillas = this.selectedPlantillas.filter(id => id !== plantillaId);
      this.selectAll = false; // Desmarcar "Seleccionar todo"
    }

    this.updateSelectionState();
  }

  /**
   * Seleccionar/deseleccionar todas las plantillas
   */
  onSelectAll(checked: boolean): void {
    this.selectAll = checked;

    if (checked) {
      this.selectedPlantillas = this.plantillas.map(p => p.id!).filter(id => id !== undefined);
    } else {
      this.selectedPlantillas = [];
    }

    this.updateSelectionState();
  }

  /**
   * Actualizar el estado de la selección
   */
  private updateSelectionState(): void {
    this.showDeleteButton = this.selectedPlantillas.length > 0;

    // Actualizar estado de "Seleccionar todo"
    if (this.selectedPlantillas.length === 0) {
      this.selectAll = false;
    } else if (this.selectedPlantillas.length === this.plantillas.length) {
      this.selectAll = true;
    }
  }

  /**
   * Verificar si una plantilla está seleccionada
   */
  isPlantillaSelected(plantillaId: number): boolean {
    return this.selectedPlantillas.includes(plantillaId);
  }

  /**
   * Eliminar plantillas seleccionadas
   */
  deleteSelectedPlantillas(): void {
    if (this.selectedPlantillas.length === 0) {
      this.errorMessage = 'No hay plantillas seleccionadas para eliminar.';
      return;
    }

    const count = this.selectedPlantillas.length;
    const message = count === 1
      ? '¿Está seguro de eliminar la plantilla seleccionada?'
      : `¿Está seguro de eliminar las ${count} plantillas seleccionadas?`;

    if (confirm(message)) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.providerService.deletePlantillasMultiple(this.selectedPlantillas).subscribe({
        next: (response) => {
          const eliminadas = response.eliminadas || count;
          this.successMessage = `${eliminadas} plantilla${eliminadas !== 1 ? 's' : ''} eliminada${eliminadas !== 1 ? 's' : ''} exitosamente.`;

          // Limpiar selección
          this.clearSelection();

          // Recargar plantillas
          this.loadPlantillas();
        },
        error: (error) => {
          console.error('Error deleting multiple templates', error);
          this.errorMessage = error.error?.detalle || 'Error al eliminar las plantillas seleccionadas.';
          this.loading = false;
        }
      });
    }
  }

  /**
   * Limpiar selección
   */
  clearSelection(): void {
    this.selectedPlantillas = [];
    this.selectAll = false;
    this.showDeleteButton = false;
  }

  // =====================================================================
  // MÉTODOS AUXILIARES
  // =====================================================================

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  getProveedorName(proveedorId: number): string {
    const proveedor = this.proveedores.find(p => p.id === proveedorId);
    return proveedor ? proveedor.nombre : 'Proveedor desconocido';
  }

  /**
   * Obtener estado visual del checkbox "Seleccionar todo"
   */
  getSelectAllState(): { checked: boolean; indeterminate: boolean } {
    const selected = this.selectedPlantillas.length;
    const total = this.plantillas.length;

    return {
      checked: selected === total && total > 0,
      indeterminate: selected > 0 && selected < total
    };
  }

  /**
   * Limpiar todos los mensajes
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Auto-limpiar mensajes después de un tiempo
   */
  private autoHideMessages(timeout: number = 5000): void {
    setTimeout(() => {
      this.clearMessages();
    }, timeout);
  }

  /**
   * TrackBy function para optimizar el rendimiento de *ngFor
   */
  trackByPlantillaId(index: number, plantilla: any): number {
    return plantilla.id;
  }

  /**
   * Obtener número de plantillas activas
   */
  getActivePlantillasCount(): number {
    return this.plantillas.filter(p => p.activo).length;
  }

  /**
   * Obtener número de plantillas inactivas
   */
  getInactivePlantillasCount(): number {
    return this.plantillas.filter(p => !p.activo).length;
  }
}

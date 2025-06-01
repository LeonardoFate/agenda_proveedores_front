// src/app/features/provider/schedule/confirm-reservation.component.ts - SIMPLIFICADO
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

interface ScheduleData {
  areaId?: number;
  areaNombre?: string;
  andenId?: number;
  andenNumero?: number;
  tipoServicioId?: number;
  tipoServicioNombre?: string;
  horaInicio?: string;
  horaFin?: string;
  tiempoDescarga?: string;
  numeroPersonas?: number;
}

@Component({
  selector: 'app-confirm-reservation',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './confirm-reservation.component.html'
})
export class ConfirmReservationComponent implements OnInit, OnDestroy {
  confirmForm: FormGroup;
  currentUser: User | null = null;
  selectedDate: string = '';
  scheduleData: ScheduleData | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private providerService: ProviderService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.confirmForm = this.createConfirmForm();
  }

  ngOnInit(): void {
    // Obtener usuario actual
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.subscriptions.push(userSub);

    // Obtener parámetros de la ruta
    const routeSub = this.route.queryParams.subscribe(params => {
      this.selectedDate = params['fecha'] || '';

      if (params['scheduleData']) {
        try {
          this.scheduleData = JSON.parse(params['scheduleData']);
          console.log('✅ Datos de plantilla recibidos:', this.scheduleData);

          // Validar que tenemos todos los datos necesarios
          if (!this.validateScheduleData(this.scheduleData)) {
            this.errorMessage = 'Datos de plantilla incompletos. Regresando...';
            setTimeout(() => this.router.navigate(['/provider/schedule']), 3000);
            return;
          }

        } catch (error) {
          console.error('❌ Error al parsear datos de plantilla:', error);
          this.errorMessage = 'Error al procesar datos de plantilla. Regresando...';
          setTimeout(() => this.router.navigate(['/provider/schedule']), 3000);
          return;
        }
      }

      // Validar que tenemos datos mínimos
      if (!this.selectedDate || !this.scheduleData) {
        this.errorMessage = 'Faltan datos requeridos para confirmar la reserva. Regresando...';
        setTimeout(() => this.router.navigate(['/provider/schedule']), 3000);
      }
    });

    this.subscriptions.push(routeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  createConfirmForm(): FormGroup {
    return this.fb.group({
      // Datos del transporte (obligatorios)
      transporteTipo: ['', [Validators.required]],
      transporteMarca: ['', [Validators.required]],
      transporteModelo: ['', [Validators.required]],
      transportePlaca: ['', [Validators.required]],
      transporteCapacidad: [''],
      numeroPalets: [''],

      // Datos del conductor (obligatorios)
      conductorNombres: ['', [Validators.required]],
      conductorApellidos: ['', [Validators.required]],
      conductorCedula: ['', [Validators.required]],

      // Observaciones opcionales
      observaciones: [''],

      // Ayudantes (opcional)
      ayudantes: this.fb.array([])
    });
  }

  get ayudantesArray(): FormArray {
    return this.confirmForm.get('ayudantes') as FormArray;
  }

  addAyudante(): void {
    this.ayudantesArray.push(this.fb.group({
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      cedula: ['', [Validators.required]]
    }));
  }

  removeAyudante(index: number): void {
    this.ayudantesArray.removeAt(index);
  }

  // ✅ MÉTODO PRINCIPAL SIMPLIFICADO
  onSubmit(): void {
    console.log('🚀 Iniciando creación de reserva desde plantilla...');
    console.log('📋 Formulario válido:', this.confirmForm.valid);
    console.log('📊 Datos de plantilla:', this.scheduleData);

    if (this.confirmForm.valid && this.scheduleData) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      // ✅ CREAR NUEVA RESERVA DIRECTAMENTE (sin buscar pendientes)
      this.createNewReservationFromTemplate();
    } else {
      console.log('❌ Formulario inválido o faltan datos de plantilla');
      this.markFormGroupTouched(this.confirmForm);
    }
  }

  // ✅ MÉTODO SIMPLIFICADO PARA CREAR RESERVA
  private createNewReservationFromTemplate(): void {
    console.log('📝 Creando nueva reserva desde plantilla...');

    if (!this.currentUser) {
      this.errorMessage = 'Error: Usuario no encontrado.';
      this.submitting = false;
      return;
    }

    // Obtener información del proveedor
    this.providerService.getProviderByUsuarioId(this.currentUser.id)
      .subscribe({
        next: (providerInfo) => {
          console.log('✅ Información del proveedor obtenida:', providerInfo);

          // ✅ CONSTRUIR DATOS DE RESERVA COMPLETA
          const reservaDTO = {
            // Datos del proveedor
            proveedorId: providerInfo.id,

            // Datos de la plantilla (readonly - pre-llenados)
            fecha: this.selectedDate,
            horaInicio: this.scheduleData!.horaInicio,
            horaFin: this.scheduleData!.horaFin,
            areaId: this.scheduleData!.areaId,
            andenId: this.scheduleData!.andenId,
            tipoServicioId: this.scheduleData!.tipoServicioId,

            // Datos del formulario (editables - completados por proveedor)
            transporteTipo: this.confirmForm.get('transporteTipo')?.value,
            transporteMarca: this.confirmForm.get('transporteMarca')?.value,
            transporteModelo: this.confirmForm.get('transporteModelo')?.value,
            transportePlaca: this.confirmForm.get('transportePlaca')?.value,
            transporteCapacidad: this.confirmForm.get('transporteCapacidad')?.value || null,

            conductorNombres: this.confirmForm.get('conductorNombres')?.value,
            conductorApellidos: this.confirmForm.get('conductorApellidos')?.value,
            conductorCedula: this.confirmForm.get('conductorCedula')?.value,

            numeroPalets: this.confirmForm.get('numeroPalets')?.value || null,
            descripcion: this.confirmForm.get('observaciones')?.value || 'Reserva creada desde plantilla de horario',
            ayudantes: this.ayudantesArray.value.length > 0 ? this.ayudantesArray.value : []
          };

          console.log('📤 Enviando datos de reserva:', reservaDTO);

          // ✅ CREAR NUEVA RESERVA DIRECTAMENTE
          this.providerService.createReservation(reservaDTO)
            .pipe(
              finalize(() => {
                this.submitting = false;
              })
            )
            .subscribe({
              next: (response) => {
                console.log('✅ Reserva creada exitosamente:', response);
                this.handleSuccess(response);
              },
              error: (error) => {
                console.error('❌ Error al crear reserva:', error);
                this.handleError(error);
              }
            });
        },
        error: (error) => {
          console.error('❌ Error al obtener información del proveedor:', error);
          this.errorMessage = 'Error al obtener información del proveedor.';
          this.submitting = false;
        }
      });
  }

  // ✅ MANEJO DE ÉXITO
  private handleSuccess(response: any): void {
    console.log('🎉 Operación exitosa:', response);
    this.successMessage = 'Reserva creada exitosamente. Será redirigido en unos segundos...';

    setTimeout(() => {
      this.router.navigate(['/provider/dashboard']);
    }, 2000);
  }

  // ✅ MANEJO DE ERRORES
  private handleError(error: any): void {
    console.error('💥 Error en la operación:', error);
    console.error('📊 Status:', error.status);
    console.error('📝 Error body:', error.error);

    switch (error.status) {
      case 400:
        this.errorMessage = `Datos inválidos: ${error.error?.message || error.error || 'Verifique los datos ingresados'}`;
        break;
      case 404:
        this.errorMessage = 'No se encontraron recursos necesarios para crear la reserva.';
        break;
      case 409:
        this.errorMessage = 'Ya existe una reserva para este horario.';
        break;
      case 500:
        this.errorMessage = 'Error interno del servidor. Contacte al administrador.';
        break;
      default:
        this.errorMessage = error.error?.message || error.error || 'Error inesperado. Intente nuevamente.';
    }
  }

  // ✅ VALIDACIÓN DE DATOS DE PLANTILLA
  private validateScheduleData(data: any): boolean {
    const requiredFields = [
      'areaId', 'areaNombre', 'andenId', 'andenNumero',
      'tipoServicioId', 'tipoServicioNombre',
      'horaInicio', 'horaFin'
    ];

    return requiredFields.every(field => {
      const hasField = data[field] !== undefined && data[field] !== null;
      if (!hasField) {
        console.error(`❌ Campo requerido faltante: ${field}`);
      }
      return hasField;
    });
  }

  // ✅ MÉTODOS DE VALIDACIÓN DE FORMULARIO
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        for (const ctrlInArray of control.controls) {
          if (ctrlInArray instanceof FormGroup) {
            this.markFormGroupTouched(ctrlInArray);
          } else {
            ctrlInArray.markAsTouched();
          }
        }
      }
    });
  }

  getControlError(controlName: string): string {
    const control = this.confirmForm.get(controlName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Este campo es obligatorio.';
      }
    }
    return '';
  }

  getFormArrayControlError(formArray: FormArray, index: number, controlName: string): string {
    const control = formArray.at(index).get(controlName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Este campo es obligatorio.';
      }
    }
    return '';
  }

  // ✅ MÉTODO PARA CANCELAR
  cancelForm(): void {
    this.router.navigate(['/provider/schedule']);
  }

  // ✅ MÉTODO AUXILIAR PARA FORMATEAR FECHAS
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

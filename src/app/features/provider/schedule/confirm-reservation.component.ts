import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { Ayudante } from '../../../core/models/reserva.model';
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
          console.log('Datos de la plantilla recibidos:', this.scheduleData);
        } catch (error) {
          console.error('Error al parsear datos de la plantilla:', error);
          this.errorMessage = 'Error al cargar los datos de la plantilla.';
        }
      }

      // Validar que tenemos los datos necesarios
      if (!this.selectedDate || !this.scheduleData) {
        this.errorMessage = 'Faltan datos requeridos para confirmar la reserva.';
        setTimeout(() => {
          this.router.navigate(['/provider/schedule']);
        }, 3000);
      }
    });

    this.subscriptions.push(routeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  createConfirmForm(): FormGroup {
    return this.fb.group({
      // Datos del transporte
      transporteTipo: ['', [Validators.required]],
      transporteMarca: ['', [Validators.required]],
      transporteModelo: ['', [Validators.required]],
      transportePlaca: ['', [Validators.required]],
      transporteCapacidad: [''],
      numeroPalets: [''],

      // Datos del conductor
      conductorNombres: ['', [Validators.required]],
      conductorApellidos: ['', [Validators.required]],
      conductorCedula: ['', [Validators.required]],

      // Observaciones
      observaciones: [''],

      // Ayudantes
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

// src/app/features/provider/schedule/confirm-reservation.component.ts - CORRECCIÓN DEL ERROR

onSubmit(): void {
  console.log('🚀 Iniciando proceso de confirmación...');
  console.log('📋 Formulario válido:', this.confirmForm.valid);

  if (this.confirmForm.valid && this.scheduleData) {
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // ✅ PASO 1: Verificar si existe una reserva pendiente para esta fecha
    console.log('🔍 Verificando reserva pendiente para fecha:', this.selectedDate);

    this.providerService.getPendingReservation(this.selectedDate)
      .subscribe({
        next: (reservaPendiente) => {
          console.log('✅ Reserva pendiente encontrada:', reservaPendiente);

          // ✅ VERIFICAR QUE EL ID EXISTE
          if (reservaPendiente && reservaPendiente.id) {
            // Si existe reserva pendiente, completar sus datos
            this.completePendingReservation(reservaPendiente.id);
          } else {
            console.error('❌ Reserva pendiente no tiene ID válido');
            this.errorMessage = 'Error: La reserva pendiente no tiene un ID válido.';
            this.submitting = false;
          }
        },
        error: (error) => {
          console.error('❌ No hay reserva pendiente:', error);

          if (error.status === 404) {
            // No hay reserva pendiente, crear una nueva
            console.log('🔄 No existe reserva pendiente, creando nueva...');
            this.createNewReservation();
          } else {
            this.errorMessage = 'Error al verificar reserva pendiente.';
            this.submitting = false;
          }
        }
      });
  } else {
    console.log('❌ Formulario inválido o faltan datos de plantilla');
    this.markFormGroupTouched(this.confirmForm);
  }
}

// ✅ MÉTODO PARA COMPLETAR RESERVA PENDIENTE EXISTENTE
private completePendingReservation(reservaId: number): void {
  console.log('📝 Completando reserva pendiente con ID:', reservaId);

  const updateData = {
    // Solo datos del vehículo y conductor (la reserva ya existe)
    transporteTipo: this.confirmForm.get('transporteTipo')?.value,
    transporteMarca: this.confirmForm.get('transporteMarca')?.value,
    transporteModelo: this.confirmForm.get('transporteModelo')?.value,
    transportePlaca: this.confirmForm.get('transportePlaca')?.value,
    transporteCapacidad: this.confirmForm.get('transporteCapacidad')?.value || null,

    conductorNombres: this.confirmForm.get('conductorNombres')?.value,
    conductorApellidos: this.confirmForm.get('conductorApellidos')?.value,
    conductorCedula: this.confirmForm.get('conductorCedula')?.value,

    descripcion: this.confirmForm.get('observaciones')?.value || 'Reserva confirmada desde plantilla de horario',
    numeroPalets: this.confirmForm.get('numeroPalets')?.value || null,
    ayudantes: this.ayudantesArray.value.length > 0 ? this.ayudantesArray.value : null
  };

  console.log('📤 Datos para completar reserva:', updateData);

  // ✅ VERIFICAR SI EXISTE EL MÉTODO updatePendingReservation
  if (this.providerService.updatePendingReservation) {
    // Usar método específico para reservas pendientes
    this.providerService.updatePendingReservation(reservaId, updateData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Reserva pendiente completada:', response);
          this.handleSuccess(response);
        },
        error: (error) => {
          console.error('❌ Error al completar reserva pendiente:', error);
          this.handleError(error);
        }
      });
  } else {
    // ✅ ALTERNATIVA: Usar método genérico de actualización
    console.log('⚠️ Usando método genérico de actualización');

    // Incluir todos los datos necesarios para actualización completa
    const fullUpdateData = {
      ...updateData,
      // Mantener datos de la plantilla
      fecha: this.selectedDate,
      horaInicio: this.scheduleData!.horaInicio,
      horaFin: this.scheduleData!.horaFin,
      areaId: this.scheduleData!.areaId,
      andenId: this.scheduleData!.andenId,
      tipoServicioId: this.scheduleData!.tipoServicioId
    };

    this.providerService.updateReservation(reservaId, fullUpdateData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Reserva actualizada:', response);
          this.handleSuccess(response);
        },
        error: (error) => {
          console.error('❌ Error al actualizar reserva:', error);
          this.handleError(error);
        }
      });
  }
}

// ✅ MÉTODO PARA CREAR NUEVA RESERVA (sin cambios)
private createNewReservation(): void {
  console.log('🔄 Creando nueva reserva...');

  // Primero obtener información del proveedor
  if (!this.currentUser) {
    this.errorMessage = 'Error: Usuario no encontrado.';
    this.submitting = false;
    return;
  }

  this.providerService.getProviderByUsuarioId(this.currentUser.id)
    .subscribe({
      next: (providerInfo) => {
        console.log('✅ Información del proveedor obtenida:', providerInfo);

        const reservaDTO = {
          proveedorId: providerInfo.id,
          fecha: this.selectedDate,
          horaInicio: this.scheduleData!.horaInicio,
          horaFin: this.scheduleData!.horaFin,
          areaId: this.scheduleData!.areaId,
          andenId: this.scheduleData!.andenId,
          tipoServicioId: this.scheduleData!.tipoServicioId,

          transporteTipo: this.confirmForm.get('transporteTipo')?.value,
          transporteMarca: this.confirmForm.get('transporteMarca')?.value,
          transporteModelo: this.confirmForm.get('transporteModelo')?.value,
          transportePlaca: this.confirmForm.get('transportePlaca')?.value,
          transporteCapacidad: this.confirmForm.get('transporteCapacidad')?.value || null,

          conductorNombres: this.confirmForm.get('conductorNombres')?.value,
          conductorApellidos: this.confirmForm.get('conductorApellidos')?.value,
          conductorCedula: this.confirmForm.get('conductorCedula')?.value,

          descripcion: this.confirmForm.get('observaciones')?.value || 'Reserva confirmada desde plantilla de horario',
          numeroPalets: this.confirmForm.get('numeroPalets')?.value || null,
          ayudantes: this.ayudantesArray.value.length > 0 ? this.ayudantesArray.value : null
        };

        console.log('📤 Creando nueva reserva con datos:', reservaDTO);

        // Usar método de confirmación para crear nueva reserva
        this.providerService.confirmReservation(reservaDTO)
          .pipe(
            finalize(() => {
              this.submitting = false;
            })
          )
          .subscribe({
            next: (response) => {
              console.log('✅ Nueva reserva creada:', response);
              this.handleSuccess(response);
            },
            error: (error) => {
              console.error('❌ Error al crear nueva reserva:', error);
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

// ✅ MANEJO DE ÉXITO Y ERRORES (sin cambios)
private handleSuccess(response: any): void {
  console.log('🎉 Operación exitosa:', response);
  this.successMessage = 'Reserva confirmada exitosamente. Será redirigido en unos segundos...';

  setTimeout(() => {
    this.router.navigate(['/provider/reservations']);
  }, 2000);
}

private handleError(error: any): void {
  console.error('💥 Error en la operación:', error);
  console.error('📊 Status:', error.status);
  console.error('📝 Error body:', error.error);

  switch (error.status) {
    case 400:
      this.errorMessage = `Datos inválidos: ${error.error?.message || error.error || 'Verifique los datos ingresados'}`;
      break;
    case 404:
      this.errorMessage = 'No se encontró la reserva o el horario especificado.';
      break;
    case 409:
      this.errorMessage = 'El horario ya fue confirmado anteriormente.';
      break;
    case 500:
      this.errorMessage = 'Error interno del servidor. Contacte al administrador.';
      break;
    default:
      this.errorMessage = error.error?.message || error.error || 'Error inesperado. Intente nuevamente.';
  }
}
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

  cancelForm(): void {
    this.router.navigate(['/provider/schedule']);
  }

  // Método auxiliar para formatear fechas
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

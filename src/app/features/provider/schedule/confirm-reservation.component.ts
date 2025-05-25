// src/app/features/provider/schedule/confirm-reservation.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { Ayudante } from '../../../core/models/reserva.model';
import { ConfirmarReservaRequest } from '../../../core/models/confirmar-reserva.model';
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

  onSubmit(): void {
    console.log('Formulario válido:', this.confirmForm.valid);
    console.log('Valores del formulario:', this.confirmForm.value);

    if (this.confirmForm.valid && this.scheduleData) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Preparar datos para enviar
      const formData: ConfirmarReservaRequest = {
        conductorNombres: this.confirmForm.get('conductorNombres')?.value,
        conductorApellidos: this.confirmForm.get('conductorApellidos')?.value,
        conductorCedula: this.confirmForm.get('conductorCedula')?.value,
        transportePlaca: this.confirmForm.get('transportePlaca')?.value,
        transporteTipo: this.confirmForm.get('transporteTipo')?.value,
        transporteMarca: this.confirmForm.get('transporteMarca')?.value,
        transporteModelo: this.confirmForm.get('transporteModelo')?.value,
        transporteCapacidad: this.confirmForm.get('transporteCapacidad')?.value || undefined,
        observaciones: this.confirmForm.get('observaciones')?.value || undefined,
        numeroPalets: this.confirmForm.get('numeroPalets')?.value || undefined,
        ayudantes: this.ayudantesArray.value.length > 0 ? this.ayudantesArray.value : undefined
      };

      console.log('Datos a enviar para confirmación:', formData);

      // Llamar al servicio para confirmar la reserva
      const confirmSub = this.providerService.confirmReservation(formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Reserva confirmada exitosamente:', response);
            this.successMessage = 'Reserva confirmada exitosamente. Será redirigido en unos segundos...';

            // Redirigir después de un breve retraso
            setTimeout(() => {
              this.router.navigate(['/provider/my-reservations']);
            }, 2000);
          },
          error: (error) => {
            this.handleError(error);
          }
        });

      this.subscriptions.push(confirmSub);
    } else {
      // Marcar todos los campos como tocados para mostrar errores de validación
      this.markFormGroupTouched(this.confirmForm);
    }
  }

  handleError(error: any): void {
    console.error('Error al confirmar reserva:', error);

    if (error.status === 400) {
      this.errorMessage = error.error?.mensaje || 'Los datos proporcionados no son válidos.';
    } else if (error.status === 404) {
      this.errorMessage = 'No se encontró el horario asignado para confirmar.';
    } else if (error.status === 409) {
      this.errorMessage = 'El horario ya fue confirmado anteriormente.';
    } else {
      this.errorMessage = error.error?.mensaje || 'Error al confirmar la reserva. Intente nuevamente.';
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

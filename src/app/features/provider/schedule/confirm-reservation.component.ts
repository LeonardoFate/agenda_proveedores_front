// src/app/features/provider/schedule/confirm-reservation.component.ts - COMPLETO
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

  // ✅ Datos para formulario
  areas: any[] = [];
  andenesPorArea: any[] = [];
  tiposServicio: any[] = [];

  // Estados
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

    // Cargar datos para formulario
    this.loadFormData();

    // Obtener parámetros de la ruta
    const routeSub = this.route.queryParams.subscribe(params => {
      this.selectedDate = params['fecha'] || '';

      if (params['scheduleData']) {
        try {
          this.scheduleData = JSON.parse(params['scheduleData']);
          console.log('✅ Datos de plantilla recibidos:', this.scheduleData);

          // Validar que tenemos datos básicos necesarios
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

  // ✅ CARGAR DATOS PARA EL FORMULARIO
  private loadFormData(): void {
    console.log('🔄 Cargando datos para formulario...');

    // Cargar áreas
    this.providerService.getAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
        console.log('✅ Áreas cargadas:', areas.length);
      },
      error: (error) => {
        console.error('❌ Error cargando áreas:', error);
        this.errorMessage = 'Error al cargar las áreas disponibles.';
      }
    });

    // Cargar tipos de servicio
    this.providerService.getTiposServicio().subscribe({
      next: (tipos) => {
        this.tiposServicio = tipos;
        console.log('✅ Tipos de servicio cargados:', tipos.length);
      },
      error: (error) => {
        console.error('❌ Error cargando tipos de servicio:', error);
        this.errorMessage = 'Error al cargar tipos de servicio disponibles.';
      }
    });
  }

  // ✅ MÉTODO PARA CARGAR ANDENES CUANDO SE SELECCIONA ÁREA
  onAreaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const areaIdStr = target?.value || '';

    if (!areaIdStr || areaIdStr === '') {
      this.andenesPorArea = [];
      this.confirmForm.patchValue({ andenId: '' });
      return;
    }

    const areaId = parseInt(areaIdStr);
    console.log('🏢 Área seleccionada:', areaId);

    if (areaId && !isNaN(areaId)) {
      this.providerService.getAndenesByArea(areaId).subscribe({
        next: (andenes) => {
          this.andenesPorArea = andenes;
          console.log('✅ Andenes cargados para área:', andenes.length);

          // Limpiar selección de andén actual
          this.confirmForm.patchValue({ andenId: '' });
        },
        error: (error) => {
          console.error('❌ Error cargando andenes:', error);
          this.andenesPorArea = [];
          this.errorMessage = 'Error al cargar los andenes del área seleccionada.';
        }
      });
    } else {
      this.andenesPorArea = [];
      this.confirmForm.patchValue({ andenId: '' });
    }
  }

  createConfirmForm(): FormGroup {
    return this.fb.group({
      // ✅ RECURSOS: Proveedor debe seleccionar
      areaId: ['', [Validators.required]],
      andenId: ['', [Validators.required]],
      tipoServicioId: ['', [Validators.required]],

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

  // ✅ MÉTODO PRINCIPAL PARA ENVIAR FORMULARIO
onSubmit(): void {
  console.log('🚀 Iniciando confirmación de PRE-RESERVA...');

  if (this.confirmForm.valid && this.scheduleData) {
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // ✅ CONFIRMAR PRE-RESERVA EN LUGAR DE CREAR NUEVA
    this.confirmExistingPreReservation();
  } else {
    console.log('❌ Formulario inválido o faltan datos de plantilla');
    this.markFormGroupTouched(this.confirmForm);
  }
}

  // ✅ MÉTODO PARA CREAR RESERVA COMPLETA
private confirmExistingPreReservation(): void {
  console.log('📝 Confirmando PRE-RESERVA existente...');

  if (!this.currentUser) {
    this.errorMessage = 'Error: Usuario no encontrado.';
    this.submitting = false;
    return;
  }

  // ✅ PRIMERO: Obtener información del proveedor
  this.providerService.getProviderByUsuarioId(this.currentUser.id).subscribe({
    next: (proveedor) => {
      console.log('✅ Proveedor obtenido:', proveedor);

      // ✅ CONSTRUIR DATOS CON PROVEEDOR ID
      const confirmData = {
        // ✅ INCLUIR EL PROVEEDOR ID (ESTO FALTABA)
        proveedorId: proveedor.id,

        // Recursos seleccionados por el proveedor
        areaId: parseInt(this.confirmForm.get('areaId')?.value),
        andenId: parseInt(this.confirmForm.get('andenId')?.value),
        tipoServicioId: parseInt(this.confirmForm.get('tipoServicioId')?.value),

        // Datos de la plantilla (readonly)
        fecha: this.selectedDate,

        // Datos del transporte
        transporteTipo: this.confirmForm.get('transporteTipo')?.value,
        transporteMarca: this.confirmForm.get('transporteMarca')?.value,
        transporteModelo: this.confirmForm.get('transporteModelo')?.value,
        transportePlaca: this.confirmForm.get('transportePlaca')?.value?.toUpperCase(),
        transporteCapacidad: this.confirmForm.get('transporteCapacidad')?.value || null,

        // Datos del conductor
        conductorNombres: this.confirmForm.get('conductorNombres')?.value,
        conductorApellidos: this.confirmForm.get('conductorApellidos')?.value,
        conductorCedula: this.confirmForm.get('conductorCedula')?.value,

        // Datos adicionales
        numeroPalets: this.confirmForm.get('numeroPalets')?.value || null,
        descripcion: this.confirmForm.get('observaciones')?.value || 'Reserva confirmada por proveedor',
        ayudantes: this.ayudantesArray.value.length > 0 ? this.ayudantesArray.value : []
      };

      console.log('📤 Enviando confirmación con todos los datos:', confirmData);

      // ✅ CONFIRMAR PRE-RESERVA
      this.providerService.confirmReservation(confirmData)
        .pipe(finalize(() => this.submitting = false))
        .subscribe({
          next: (response) => {
            console.log('✅ PRE-RESERVA confirmada exitosamente:', response);
            this.handleSuccess(response);
          },
          error: (error) => {
            console.error('❌ Error al confirmar PRE-RESERVA:', error);
            this.handleError(error);
          }
        });
    },
    error: (error) => {
      console.error('❌ Error obteniendo proveedor:', error);
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
        if (error.error && typeof error.error === 'object') {
          // Error de validación con campos específicos
          const validationErrors = Object.values(error.error).join(', ');
          this.errorMessage = `Datos inválidos: ${validationErrors}`;
        } else {
          this.errorMessage = `Datos inválidos: ${error.error?.message || error.error || 'Verifique los datos ingresados'}`;
        }
        break;
      case 404:
        this.errorMessage = 'No se encontraron recursos necesarios para crear la reserva.';
        break;
      case 409:
        this.errorMessage = 'Ya existe una reserva para este horario y ubicación.';
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
    const requiredFields = ['horaInicio', 'horaFin'];

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
    if (confirm('¿Está seguro de cancelar? Se perderán todos los datos ingresados.')) {
      this.router.navigate(['/provider/schedule']);
    }
  }

  // ✅ MÉTODO AUXILIAR PARA FORMATEAR FECHAS
formatDate(dateString: string): string {
  if (!dateString) return '';

  // Crear fecha en zona local para evitar problemas de UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // Los meses van de 0-11

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
}

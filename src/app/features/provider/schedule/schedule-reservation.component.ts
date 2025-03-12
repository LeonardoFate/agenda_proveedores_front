import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ProviderService } from '../../../core/services/provider.service';
import { User } from '../../../core/models/user.model';
import { Ayudante, DisponibilidadAnden } from '../../../core/models/reserva.model';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-schedule-reservation',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './schedule-reservation.component.html',
  styleUrls: []
})
export class ScheduleReservationComponent implements OnInit, OnDestroy {
  reservationForm: FormGroup;
  areas: any[] = [];
  tiposServicio: any[] = [];
  andenes: any[] = [];
  disponibilidad: DisponibilidadAnden[] = [];
  horariosOcupados: {[key: number]: {horaInicio: string, horaFin: string}[]} = {};
  currentUser: User | null = null;
  loading = false;
  submitting = false;
  isEditing = false;
  reservationId: number | null = null;
  errorMessage = '';
  successMessage = '';
  minDate: string;
  maxDate: string;

  // Para gestionar suscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private providerService: ProviderService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Inicializar formulario
    this.reservationForm = this.createReservationForm();

    // Configurar fechas mínima y máxima (hoy y 2 meses en adelante)
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    this.maxDate = maxDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Usuario actual:', user);

      if (user) {
        // Establecer el ID del proveedor al iniciar
        this.reservationForm.patchValue({ proveedorId: user.id });
      }

      // Obtener ID de reserva para edición (si existe)
      const routeSub = this.route.data.subscribe(data => {
        this.isEditing = data['isEditing'] || false;
        console.log('Modo edición:', this.isEditing);
      });
      this.subscriptions.push(routeSub);

      const id = this.route.snapshot.paramMap.get('id');
      if (id && this.isEditing) {
        this.reservationId = +id;
        this.loadReservationDetails(this.reservationId);
      }

      // Cargar datos para los selects
      this.loadAreas();
      this.loadTiposServicio();
    });

    this.subscriptions.push(userSub);
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  createReservationForm(): FormGroup {
    return this.fb.group({
      proveedorId: ['', Validators.required],
      areaId: ['', Validators.required],
      andenId: ['', Validators.required],
      tipoServicioId: ['', Validators.required],
      fecha: ['', [Validators.required]],
      horaInicio: ['', [Validators.required]],
      horaFin: ['', [Validators.required]],
      descripcion: [''],
      transporteTipo: ['', [Validators.required]],
      transporteMarca: ['', [Validators.required]],
      transporteModelo: ['', [Validators.required]],
      transportePlaca: ['', [Validators.required]],
      transporteCapacidad: [''],
      conductorNombres: ['', [Validators.required]],
      conductorApellidos: ['', [Validators.required]],
      conductorCedula: ['', [Validators.required]],
      ayudantes: this.fb.array([])
    });
  }

  loadReservationDetails(id: number): void {
    this.loading = true;
    const detailsSub = this.providerService.getReservationById(id).subscribe({
      next: (data) => {
        console.log('Datos de reserva cargados:', data);

        // Si el área ya está cargada, cargar los andenes
        if (data.areaId) {
          this.loadAndenes(data.areaId);
        }

        // Cargar ayudantes si existen
        if (data.ayudantes && data.ayudantes.length > 0) {
          this.clearAyudantes();
          data.ayudantes.forEach(ayudante => {
            this.addAyudante(ayudante);
          });
        }

        // Establecer proveedorId del usuario actual
        if (this.currentUser) {
          data.proveedorId = this.currentUser.id;
          console.log('ProveedorId establecido:', this.currentUser.id);
        }

        // Actualizar el formulario con los datos de la reserva
        this.reservationForm.patchValue(data);
        console.log('Formulario actualizado con datos:', this.reservationForm.value);

        // Verificar disponibilidad para la fecha y área seleccionadas
        if (data.fecha && data.areaId) {
          this.checkAvailability(data.fecha, data.areaId, data.tipoServicioId);
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading reservation details', error);
        this.errorMessage = 'No se pudo cargar los detalles de la reserva.';
        this.loading = false;
      }
    });

    this.subscriptions.push(detailsSub);
  }

  loadAreas(): void {
    const areasSub = this.providerService.getAreas().subscribe({
      next: (data) => {
        this.areas = data;
        console.log('Áreas cargadas:', this.areas);
      },
      error: (error) => {
        console.error('Error loading areas', error);
        this.errorMessage = 'Error al cargar las áreas disponibles.';
      }
    });

    this.subscriptions.push(areasSub);
  }

  loadTiposServicio(): void {
    const tiposSub = this.providerService.getTiposServicio().subscribe({
      next: (data) => {
        this.tiposServicio = data;
        console.log('Tipos de servicio cargados:', this.tiposServicio);
      },
      error: (error) => {
        console.error('Error loading service types', error);
        this.errorMessage = 'Error al cargar los tipos de servicio.';
      }
    });

    this.subscriptions.push(tiposSub);
  }

  loadAndenes(areaId: number): void {
    const tipoServicioId = this.reservationForm.get('tipoServicioId')?.value;
    const andenesSub = this.providerService.getAndenesByArea(areaId).subscribe({
      next: (data) => {
        console.log('Andenes originales:', data);

        // Filtrar andenes según tipo de servicio si es necesario
        if (tipoServicioId) {
          const tipoServicio = this.tiposServicio.find(t => t.id === +tipoServicioId);
          console.log('Tipo servicio seleccionado:', tipoServicio);

          if (tipoServicio && tipoServicio.nombre === 'Contenedor') {
            this.andenes = data.filter(a => a.exclusivoContenedor);
          } else {
            this.andenes = data.filter(a => !a.exclusivoContenedor);
          }
        } else {
          this.andenes = data;
        }

        console.log('Andenes filtrados:', this.andenes);
      },
      error: (error) => {
        console.error('Error loading docks', error);
        this.errorMessage = 'Error al cargar los andenes disponibles.';
      }
    });

    this.subscriptions.push(andenesSub);
  }

  checkAvailability(fecha: string, areaId: number, tipoServicioId?: number): void {
    const availSub = this.providerService.checkAvailability(fecha, areaId, tipoServicioId).subscribe({
      next: (data) => {
        this.disponibilidad = data;
        console.log('Disponibilidad:', this.disponibilidad);

        // Procesar horarios ocupados por andén
        this.horariosOcupados = {};
        data.forEach(disponibilidad => {
          this.horariosOcupados[disponibilidad.andenId] = disponibilidad.horariosReservados;
        });
        console.log('Horarios ocupados:', this.horariosOcupados);
      },
      error: (error) => {
        console.error('Error checking availability', error);
        this.errorMessage = 'Error al verificar la disponibilidad.';
      }
    });

    this.subscriptions.push(availSub);
  }

  onAreaChange(): void {
    const areaId = this.reservationForm.get('areaId')?.value;
    console.log('Área seleccionada:', areaId);

    if (areaId) {
      this.loadAndenes(areaId);

      // Reiniciar andén seleccionado
      this.reservationForm.patchValue({ andenId: '' });

      // Si ya hay fecha seleccionada, verificar disponibilidad
      const fecha = this.reservationForm.get('fecha')?.value;
      const tipoServicioId = this.reservationForm.get('tipoServicioId')?.value;
      if (fecha) {
        this.checkAvailability(fecha, areaId, tipoServicioId);
      }
    }
  }

  onTipoServicioChange(): void {
    const tipoServicioId = this.reservationForm.get('tipoServicioId')?.value;
    console.log('Tipo de servicio seleccionado:', tipoServicioId);

    const areaId = this.reservationForm.get('areaId')?.value;
    if (areaId) {
      this.loadAndenes(areaId);

      // Reiniciar andén seleccionado
      this.reservationForm.patchValue({ andenId: '' });

      // Si ya hay fecha seleccionada, verificar disponibilidad
      const fecha = this.reservationForm.get('fecha')?.value;
      if (fecha) {
        this.checkAvailability(fecha, areaId, tipoServicioId);
      }
    }
  }

  onFechaChange(): void {
    const fecha = this.reservationForm.get('fecha')?.value;
    console.log('Fecha seleccionada:', fecha);

    const areaId = this.reservationForm.get('areaId')?.value;
    const tipoServicioId = this.reservationForm.get('tipoServicioId')?.value;

    if (fecha && areaId) {
      this.checkAvailability(fecha, areaId, tipoServicioId);
    }
  }

  isHourAvailable(hora: string, andenId: number): boolean {
    if (!this.horariosOcupados[andenId]) return true;

    const horaCheck = new Date(`2000-01-01T${hora}`);

    for (const horario of this.horariosOcupados[andenId]) {
      const horaInicio = new Date(`2000-01-01T${horario.horaInicio}`);
      const horaFin = new Date(`2000-01-01T${horario.horaFin}`);

      if (horaCheck >= horaInicio && horaCheck < horaFin) {
        return false;
      }
    }

    return true;
  }

  getHorasDisponibles(): string[] {
    // Horario de operación: 6:00 AM a 10:00 PM
    const horas = [];
    for (let i = 6; i < 22; i++) {
      const hora = `${i.toString().padStart(2, '0')}:00`;
      horas.push(hora);
    }
    return horas;
  }

  isAndenDisponible(andenId: number): boolean {
    const horaInicio = this.reservationForm.get('horaInicio')?.value;
    if (!horaInicio) return true;
    return this.isHourAvailable(horaInicio, andenId);
  }

  get ayudantesArray(): FormArray {
    return this.reservationForm.get('ayudantes') as FormArray;
  }

  addAyudante(ayudante?: Ayudante): void {
    this.ayudantesArray.push(this.fb.group({
      nombres: [ayudante ? ayudante.nombres : '', [Validators.required]],
      apellidos: [ayudante ? ayudante.apellidos : '', [Validators.required]],
      cedula: [ayudante ? ayudante.cedula : '', [Validators.required]]
    }));
    console.log('Ayudante añadido, total:', this.ayudantesArray.length);
  }

  removeAyudante(index: number): void {
    this.ayudantesArray.removeAt(index);
    console.log('Ayudante eliminado, total:', this.ayudantesArray.length);
  }

  clearAyudantes(): void {
    while (this.ayudantesArray.length > 0) {
      this.ayudantesArray.removeAt(0);
    }
    console.log('Ayudantes limpiados');
  }

  onSubmit(): void {
    console.log('Formulario válido:', this.reservationForm.valid);
    console.log('Valores del formulario:', this.reservationForm.value);
    console.log('Errores del formulario:', this.getFormValidationErrors());

    if (this.reservationForm.valid) {
      this.submitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      // SIEMPRE asegurarse de que el ID del proveedor esté establecido
      if (this.currentUser) {
        this.reservationForm.patchValue({ proveedorId: this.currentUser.id });
        console.log('ProveedorId actualizado antes de enviar:', this.currentUser.id);
      }

      const formData = {...this.reservationForm.value};
      console.log('Datos a enviar:', formData);

      if (this.isEditing && this.reservationId) {
        // Actualizar reserva existente
        const updateSub = this.providerService.updateReservation(this.reservationId, formData)
          .pipe(
            finalize(() => {
              console.log('Finalizado el proceso de actualización');
              this.submitting = false;
            })
          )
          .subscribe({
            next: (response) => {
              console.log('Reserva actualizada exitosamente:', response);
              this.successMessage = 'Reserva actualizada exitosamente';

              // Redirigir después de un breve retraso
              setTimeout(() => {
                this.router.navigate(['/provider/my-reservations']);
              }, 1500);
            },
            error: (error) => {
              this.handleError(error);
            }
          });

        this.subscriptions.push(updateSub);
      } else {
        // Crear nueva reserva
        const createSub = this.providerService.createReservation(formData)
          .pipe(
            finalize(() => {
              console.log('Finalizado el proceso de creación');
              this.submitting = false;
            })
          )
          .subscribe({
            next: (response) => {
              console.log('Reserva creada exitosamente:', response);
              this.successMessage = 'Reserva creada exitosamente';

              // Redirigir después de un breve retraso
              setTimeout(() => {
                this.router.navigate(['/provider/my-reservations']);
              }, 1500);
            },
            error: (error) => {
              this.handleError(error);
            }
          });

        this.subscriptions.push(createSub);
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores de validación
      this.markFormGroupTouched(this.reservationForm);
    }
  }

  // Método para obtener todos los errores del formulario (depuración)
  getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.reservationForm.controls).forEach(key => {
      const control = this.reservationForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  handleError(error: any): void {
    this.submitting = false;
    console.error('Error completo:', error);

    if (error.status === 400) {
      console.log('Error 400 details:', error.error);
      this.errorMessage = error.error?.mensaje || 'El horario seleccionado no está disponible para este andén.';
    } else if (error.status === 401) {
      this.errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      // Podrías redirigir al login aquí
    } else if (error.status === 403) {
      this.errorMessage = 'No tiene permisos para realizar esta acción.';
    } else if (error.status === 404) {
      this.errorMessage = 'No se encontró el recurso solicitado.';
    } else {
      this.errorMessage = error.error?.mensaje || 'Error al procesar la solicitud. Intente nuevamente.';
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
    const control = this.reservationForm.get(controlName);
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
    this.router.navigate(['/provider/my-reservations']);
  }
}

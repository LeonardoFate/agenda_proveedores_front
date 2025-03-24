import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditing = false;
  userId: number | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      rol: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      this.userId = +id;
      this.loadUser(this.userId);

      // Hacer el campo de contraseña opcional al editar
      this.userForm.get('password')?.setValidators(Validators.minLength(6));
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  loadUser(id: number): void {
    this.loading = true;
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        // Llenar el formulario con los datos del usuario (excepto la contraseña)
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol
        });
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los datos del usuario.';
        console.error('Error loading user', error);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Obtener los datos del formulario
      const userData = { ...this.userForm.value };
      const newPassword = userData.password; // Guardar la contraseña para usarla después

      if (this.isEditing && this.userId !== null) {
        // Siempre eliminamos la contraseña del objeto de actualización de usuario
        delete userData.password;

        // Primero actualizamos la información general del usuario
        this.userService.updateUser(this.userId, userData).subscribe({
          next: () => {
            // Si hay una nueva contraseña, la actualizamos en una llamada separada
            if (newPassword) {
              console.log('Cambiando contraseña para usuario:', this.userId);
              this.userService.changePassword(this.userId!, newPassword).subscribe({
                next: () => {
                  console.log('Contraseña actualizada exitosamente');
                  this.successMessage = 'Usuario y contraseña actualizados exitosamente.';
                  this.loading = false;
                  setTimeout(() => {
                    this.router.navigate(['/admin/users']);
                  }, 1500);
                },
                error: (error) => {
                  console.error('Error al cambiar contraseña:', error);
                  this.handleError(error);
                }
              });
            } else {
              // Si no hay nueva contraseña, terminamos aquí
              this.successMessage = 'Usuario actualizado exitosamente.';
              this.loading = false;
              setTimeout(() => {
                this.router.navigate(['/admin/users']);
              }, 1500);
            }
          },
          error: (error) => {
            this.handleError(error);
          }
        });
      } else {
        // Creación de un nuevo usuario (mantener el código existente)
        this.userService.createUser(userData).subscribe({
          next: () => {
            this.successMessage = 'Usuario creado exitosamente.';
            this.loading = false;
            setTimeout(() => {
              this.router.navigate(['/admin/users']);
            }, 1500);
          },
          error: (error) => {
            this.handleError(error);
          }
        });
      }
    } else {
      // Marcar todos los campos como tocados para mostrar las validaciones
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
    }
  }

  handleError(error: any): void {
    this.loading = false;
    if (error.status === 409) {
      this.errorMessage = 'El nombre de usuario o email ya está en uso.';
    } else {
      this.errorMessage = error.error?.mensaje || 'Error al procesar la solicitud.';
    }
    console.error('Error submitting form', error);
  }

  getControlError(controlName: string): string {
    const control = this.userForm.get(controlName);
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Este campo es obligatorio.';
      }
      if (control.errors?.['minlength']) {
        const minLength = control.errors?.['minlength'].requiredLength;
        return `Debe tener al menos ${minLength} caracteres.`;
      }
      if (control.errors?.['email']) {
        return 'Ingrese un email válido.';
      }
    }
    return '';
  }

  cancelForm(): void {
    this.router.navigate(['/admin/users']);
  }
}

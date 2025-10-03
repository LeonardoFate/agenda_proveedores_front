// src/app/features/auth/register/register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PrivacyPolicyModalComponent } from '../privacy-policy-modal/privacy-policy-modal.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PrivacyPolicyModalComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showPrivacyModal = false;
  privacyAccepted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      // Información de usuario
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],

      // Información de empresa
      nombreEmpresa: ['', [Validators.required]],
      ruc: ['', [Validators.required, Validators.minLength(10)]],
      direccion: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
      
      aceptoPoliticaPrivacidad: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      const errors = confirmPassword?.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }
  }

  // MÉTODO PARA ABRIR MODAL
  openPrivacyModal() {
    this.showPrivacyModal = true;
  }

  // MÉTODO CUANDO ACEPTA LA POLÍTICA
  onPrivacyAccepted(accepted: boolean) {
    this.privacyAccepted = accepted;
    this.registerForm.patchValue({ aceptoPoliticaPrivacidad: true });
    this.showPrivacyModal = false;
  }

  // MÉTODO CUANDO CIERRA EL MODAL
  onPrivacyModalClosed() {
    this.showPrivacyModal = false;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { confirmPassword, ...registrationData } = this.registerForm.value;

      this.authService.registerProvider(registrationData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Registro exitoso. Ahora puede iniciar sesión.';

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 409) {
            this.errorMessage = 'El usuario o el RUC ya están registrados.';
          } else {
            this.errorMessage = error.error?.mensaje || 'Error en el registro. Intente nuevamente.';
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
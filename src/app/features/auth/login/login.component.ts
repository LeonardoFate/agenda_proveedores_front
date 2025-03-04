import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;

          // Redirigir según el rol del usuario
          switch (response.rol) {
            case 'ADMIN':
              this.router.navigate(['/admin/dashboard']);
              break;
            case 'GUARDIA':
              this.router.navigate(['/guard/dashboard']);
              break;
            case 'AGENTE':
              this.router.navigate(['/agent/dashboard']);
              break;
            case 'PROVEEDOR':
              this.router.navigate(['/provider/dashboard']);
              break;
            default:
              this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 401) {
            this.errorMessage = 'Nombre de usuario o contraseña incorrectos';
          } else {
            this.errorMessage = error.error?.mensaje || 'Error en la autenticación';
          }
        }
      });
    } else {
      // Marcar campos como tocados para mostrar validaciones
      this.loginForm.markAllAsTouched();
    }
  }
}

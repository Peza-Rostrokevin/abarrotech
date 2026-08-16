import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, NgIf],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  error = '';
  loading = false;

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) {
      this.error = 'Nombre, email y contraseña son obligatorios';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService
      .register({ name: this.name, email: this.email, password: this.password })
      .subscribe({
        next: (user) => {
          this.loading = false;
          this.router.navigate([user.role === 'admin' ? '/admin' : '/mis-productos']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message ?? 'Error al registrarse';
        }
      });
  }
}

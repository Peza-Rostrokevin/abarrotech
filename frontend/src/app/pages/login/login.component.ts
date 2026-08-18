import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  error = '';
  loading = false;

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Email y contraseña son obligatorios';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (user) => {
        this.loading = false;
        this.router.navigate([user.role === 'admin' ? '/admin' : '/mis-ventas']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message ?? 'Error al iniciar sesión';
      }
    });
  }
}

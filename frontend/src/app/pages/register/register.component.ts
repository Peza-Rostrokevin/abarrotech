import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);

  name = '';
  email = '';
  password = '';
  phone = '';
  inviteToken = '';
  error = '';
  loading = false;

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.inviteToken = token;
    } else {
      this.error = 'El registro solo está disponible mediante invitación del administrador';
    }
  }

  onSubmit(): void {
    if (!this.name || !this.email || !this.password || !this.phone) {
      this.error = 'Nombre, email, contraseña y WhatsApp son obligatorios';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (!/^\d{10}$/.test(this.phone)) {
      this.error = 'El WhatsApp debe tener exactamente 10 dígitos (solo números)';
      return;
    }
    if (!this.inviteToken) {
      this.error = 'Token de invitación requerido';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService
      .register({
        name: this.name,
        email: this.email,
        password: this.password,
        phone: this.phone,
        inviteToken: this.inviteToken
      })
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

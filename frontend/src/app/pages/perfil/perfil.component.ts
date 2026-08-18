import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule, NgIf],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.currentUser;
  activeCard: 'datos' | 'password' = 'datos';

  profile = {
    name: '',
    email: '',
    phone: ''
  };
  profileError = '';
  profileSuccess = '';
  savingProfile = false;

  password = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordError = '';
  passwordSuccess = '';
  savingPassword = false;

  constructor() {
    const u = this.user();
    if (u) {
      this.profile = {
        name: u.name,
        email: u.email,
        phone: u.phone ?? ''
      };
    }
  }

  toggleCard(card: 'datos' | 'password'): void {
    this.activeCard = this.activeCard === card ? (card === 'datos' ? 'password' : 'datos') : card;
  }

  onSaveProfile(): void {
    if (!this.profile.name || !this.profile.email || !this.profile.phone) {
      this.profileError = 'Nombre, email y WhatsApp son obligatorios';
      return;
    }
    if (!/^\d{10}$/.test(this.profile.phone)) {
      this.profileError = 'El WhatsApp debe tener exactamente 10 dígitos';
      return;
    }

    this.savingProfile = true;
    this.profileError = '';
    this.profileSuccess = '';

    this.authService.updateProfile(this.profile).subscribe({
      next: () => {
        this.savingProfile = false;
        this.profileSuccess = 'Perfil actualizado correctamente';
      },
      error: (err) => {
        this.savingProfile = false;
        this.profileError = err.error?.message ?? 'Error al actualizar el perfil';
      }
    });
  }

  onChangePassword(): void {
    if (!this.password.currentPassword || !this.password.newPassword) {
      this.passwordError = 'Contraseña actual y nueva son obligatorias';
      return;
    }
    if (this.password.newPassword.length < 6) {
      this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.password.newPassword !== this.password.confirmPassword) {
      this.passwordError = 'Las contraseñas no coinciden';
      return;
    }

    this.savingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.authService
      .changePassword({
        currentPassword: this.password.currentPassword,
        newPassword: this.password.newPassword
      })
      .subscribe({
        next: () => {
          this.savingPassword = false;
          this.passwordSuccess = 'Contraseña actualizada correctamente';
          this.password = { currentPassword: '', newPassword: '', confirmPassword: '' };
        },
        error: (err) => {
          this.savingPassword = false;
          this.passwordError = err.error?.message ?? 'Error al cambiar la contraseña';
        }
      });
  }
}

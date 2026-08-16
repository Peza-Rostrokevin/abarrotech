import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { User } from '../../models/user.model';
import { Product } from '../../models/product.model';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  private readonly adminService = inject(AdminService);

  readonly users = signal<User[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tab = signal<'vendedores' | 'productos'>('vendedores');

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar vendedores');
        this.loading.set(false);
      }
    });

    this.adminService.getProducts().subscribe({
      next: (products) => this.products.set(products),
      error: () => this.error.set('Error al cargar productos')
    });
  }

  setTab(tab: 'vendedores' | 'productos'): void {
    this.tab.set(tab);
  }

  onDeleteUser(user: User): void {
    const confirmMsg = `¿Eliminar al vendedor "${user.name}" y todos sus productos?`;
    if (!window.confirm(confirmMsg)) return;

    this.adminService.deleteUser(user._id).subscribe({
      next: () => this.loadData(),
      error: () => this.error.set('Error al eliminar el vendedor')
    });
  }

  getSellerName(product: Product): string {
    if (typeof product.sellerId === 'string') return 'Desconocido';
    return product.sellerId?.name ?? 'Desconocido';
  }
}

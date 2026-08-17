import { Component, inject, signal } from '@angular/core';
import { NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-producto-detalle',
  imports: [NgIf, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './producto-detalle.component.html',
  styleUrl: './producto-detalle.component.css'
})
export class ProductoDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    } else {
      this.error.set('Producto no encontrado');
      this.loading.set(false);
    }
  }

  private loadProduct(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el producto');
        this.loading.set(false);
      }
    });
  }

  getSellerName(): string {
    const product = this.product();
    if (!product) return '';
    if (typeof product.sellerId === 'string') return '';
    return product.sellerId?.name ?? '';
  }

  getSellerPhone(): string {
    const product = this.product();
    if (!product) return '';
    if (typeof product.sellerId === 'string') return '';
    return product.sellerId?.phone ?? '';
  }

  getWhatsAppUrl(): string {
    const digits = this.getSellerPhone().replace(/\D/g, '');
    if (!digits) return '';

    let full = digits;
    if (digits.length === 10) {
      full = `52${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      full = `52${digits.slice(1)}`;
    } else if (digits.length === 12 && digits.startsWith('52')) {
      full = digits;
    }

    return `https://wa.me/${full}`;
  }
}

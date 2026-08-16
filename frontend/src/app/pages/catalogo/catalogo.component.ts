import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-catalogo',
  imports: [NgIf, NgFor, CurrencyPipe, FormsModule],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css'
})
export class CatalogoComponent {
  private readonly productService = inject(ProductService);

  readonly products = signal<Product[]>([]);
  readonly filtered = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  searchTerm = '';

  constructor() {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.filtered.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el catálogo. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filtered.set(this.products());
      return;
    }
    this.filtered.set(
      this.products().filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.location.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      )
    );
  }

  getSellerName(product: Product): string {
    if (typeof product.sellerId === 'string') return '';
    return product.sellerId?.name ?? '';
  }
}

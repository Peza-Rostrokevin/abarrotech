import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductPayload } from '../../models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-mis-productos',
  imports: [NgIf, NgFor, CurrencyPipe, FormsModule],
  templateUrl: './mis-productos.component.html',
  styleUrl: './mis-productos.component.css'
})
export class MisProductosComponent {
  private readonly productService = inject(ProductService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  form = {
    name: '',
    price: 0,
    location: '',
    description: ''
  };
  selectedFile: File | null = null;
  previewUrl = '';
  formError = '';
  saving = false;

  constructor() {
    this.loadMyProducts();
  }

  private loadMyProducts(): void {
    this.productService.getMyProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar tus productos');
        this.loading.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
    this.editingId.set(product._id);
    this.form = {
      name: product.name,
      price: product.price,
      location: product.location,
      description: product.description
    };
    this.selectedFile = null;
    this.previewUrl = product.imageUrl;
    this.formError = '';
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.formError = 'El archivo seleccionado no es una imagen';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.formError = 'La imagen no puede superar los 5 MB';
      return;
    }

    this.formError = '';
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  onSubmit(): void {
    if (!this.form.name || this.form.price <= 0 || !this.form.location) {
      this.formError = 'Nombre, precio y ubicación son obligatorios';
      return;
    }
    if (!this.selectedFile && !this.previewUrl) {
      this.formError = 'Debes seleccionar una imagen del producto';
      return;
    }

    this.saving = true;
    this.formError = '';

    const payload: ProductPayload = {
      name: this.form.name,
      price: this.form.price,
      location: this.form.location,
      description: this.form.description,
      imageFile: this.selectedFile
    };

    const editingId = this.editingId();
    const request = editingId
      ? this.productService.updateProduct(editingId, payload)
      : this.productService.createProduct(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showForm.set(false);
        this.editingId.set(null);
        this.resetForm();
        this.loadMyProducts();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message ?? 'Error al guardar el producto';
      }
    });
  }

  onDelete(product: Product): void {
    const confirmMsg = `¿Seguro que quieres eliminar "${product.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    this.productService.deleteProduct(product._id).subscribe({
      next: () => this.loadMyProducts(),
      error: () => this.error.set('Error al eliminar el producto')
    });
  }

  private resetForm(): void {
    this.form = { name: '', price: 0, location: '', description: '' };
    this.selectedFile = null;
    this.previewUrl = '';
    this.formError = '';
  }
}

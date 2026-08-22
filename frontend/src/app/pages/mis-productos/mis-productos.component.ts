import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductPayload, ProductVariantPayload } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { AuthService } from '../../core/services/auth.service';

interface VariantFormRow {
  name: string;
  price: number | null;
  stock: number;
  imageUrl: string;
  imageFile: File | null;
}

@Component({
  selector: 'app-mis-productos',
  imports: [NgIf, NgFor, CurrencyPipe, FormsModule],
  templateUrl: './mis-productos.component.html',
  styleUrl: './mis-productos.component.css'
})
export class MisProductosComponent {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly sellerLocation = signal('');
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  form = {
    name: '',
    price: 0,
    type: 'producto' as 'producto' | 'servicio',
    stock: 0,
    isAvailable: true,
    isMadeToOrder: false,
    categoryId: '',
    description: ''
  };
  hasVariants = false;
  variantRows: VariantFormRow[] = [];
  selectedFile: File | null = null;
  previewUrl = '';
  formError = '';
  saving = false;
  isDragging = false;
  imageAreaActive = false;
  variantImageActive = -1;
  variantDragging = -1;

  constructor() {
    const me = this.authService.currentUser();
    this.sellerLocation.set(me?.location ?? '');
    this.loadMyProducts();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => {
        // Silencioso: la categoría es opcional
      }
    });
  }

  getCategoryName(categoryId: string | null | { _id: string; name: string } | undefined): string {
    if (!categoryId) return 'Sin categoría';
    if (typeof categoryId !== 'string') return categoryId.name;
    const cat = this.categories().find((c) => c._id === categoryId);
    return cat?.name ?? 'Sin categoría';
  }

  hasVariantsOf(product: Product): boolean {
    return (product.variants ?? []).length > 0;
  }

  variantStockSummary(product: Product): string {
    const variants = product.variants ?? [];
    const total = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
    const parts = variants.map((v) => `${v.name || 'Variante'}: ${v.stock ?? 0}`);
    return `Stock: ${total} pieza${total === 1 ? '' : 's'} en total (${parts.join(', ')})`;
  }

  get isProduct(): boolean {
    return this.form.type === 'producto';
  }

  get isStockBased(): boolean {
    return this.isProduct && !this.form.isMadeToOrder;
  }

  get priceRequired(): boolean {
    return this.isProduct;
  }

  onTypeChange(): void {
    if (this.form.type === 'servicio') {
      this.form.stock = 0;
      this.form.isMadeToOrder = false;
      this.hasVariants = false;
      this.variantRows = [];
    }
    this.syncAvailability();
  }

  onMadeToOrderChange(): void {
    if (this.form.isMadeToOrder) {
      this.form.stock = 0;
    }
    this.syncAvailability();
  }

  onStockChange(): void {
    this.syncAvailability();
  }

  onNotAvailableChange(checked: boolean): void {
    this.form.isAvailable = !checked;
  }

  syncAvailability(): void {
    if (!this.isStockBased) return;
    if (this.hasVariants) {
      this.form.isAvailable = this.variantRows.some((r) => r.stock > 0);
    } else {
      this.form.isAvailable = this.form.stock > 0;
    }
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
      price: product.price ?? 0,
      type: product.type ?? 'producto',
      stock: product.stock ?? 0,
      isAvailable: product.isAvailable ?? true,
      isMadeToOrder: product.isMadeToOrder ?? false,
      categoryId: typeof product.categoryId === 'string' ? product.categoryId : '',
      description: product.description
    };
    this.hasVariants = (product.variants ?? []).length > 0;
    this.variantRows = (product.variants ?? []).map((v) => ({
      name: v.name,
      price: v.price ?? null,
      stock: v.stock ?? 0,
      imageUrl: v.imageUrl ?? '',
      imageFile: null
    }));
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
    this.handleFile(file);
  }

  // Valida e incorpora la imagen que llega del input, del portapapeles (Ctrl+V)
  // o de arrastrar y soltar (drag & drop)
  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.formError = 'El archivo no es una imagen válida';
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

  // Al hacer clic fuera del input oculto se activa la zona para poder pegar
  onImageAreaClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'LABEL') return;
    (event.currentTarget as HTMLElement).focus();
  }

  // Marca visualmente si la zona de imagen tiene el foco
  onImageAreaFocus(active: boolean): void {
    this.imageAreaActive = active;
  }

  // Pega la imagen que tengas copiada con Ctrl+V cuando la zona está enfocada
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          this.handleFile(file);
        }
        return;
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  // Suelta la imagen arrastrada sobre la zona
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.handleFile(file);
  }

  onVariantsToggle(checked: boolean): void {
    this.hasVariants = checked;
    if (checked && this.variantRows.length === 0) {
      this.addVariantRow();
    }
    this.syncAvailability();
  }

  addVariantRow(): void {
    this.variantRows.push({ name: '', price: null, stock: 0, imageUrl: '', imageFile: null });
  }

  removeVariantRow(index: number): void {
    this.variantRows.splice(index, 1);
  }

  onVariantFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.handleVariantFile(file, index);
  }

  // Valida e incorpora la imagen de la variante (input, Ctrl+V o arrastrar)
  private handleVariantFile(file: File, index: number): void {
    const row = this.variantRows[index];
    if (!row) return;

    if (!file.type.startsWith('image/')) {
      this.formError = `La imagen de "${row.name || 'la variante'}" no es una imagen válida`;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.formError = `La imagen de "${row.name || 'la variante'}" no puede superar los 5 MB`;
      return;
    }

    this.formError = '';
    row.imageFile = file;
    row.imageUrl = URL.createObjectURL(file);
  }

  // Al hacer clic fuera del input oculto se activa la zona para poder pegar
  onVariantImageClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'LABEL' || target.tagName === 'IMG') return;
    (event.currentTarget as HTMLElement).focus();
  }

  // Pega la imagen con Ctrl+V cuando la zona de la variante está enfocada
  onVariantPaste(event: ClipboardEvent, index: number): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          this.handleVariantFile(file, index);
        }
        return;
      }
    }
  }

  onVariantDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.variantDragging = index;
  }

  onVariantDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.variantDragging = -1;
  }

  // Suelta la imagen arrastrada sobre la zona de la variante
  onVariantDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.variantDragging = -1;

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.handleVariantFile(file, index);
  }

  private buildVariantsPayload(): ProductVariantPayload[] {
    return this.variantRows.map((row) => ({
      name: row.name,
      price: row.price === null || row.price === undefined || row.price === 0 ? null : row.price,
      stock: row.stock,
      imageUrl: row.imageUrl,
      imageFile: row.imageFile
    }));
  }

  onSubmit(): void {
    if (!this.form.name) {
      this.formError = 'El nombre del producto es obligatorio';
      return;
    }

    const variantsPayload = this.hasVariants ? this.buildVariantsPayload() : [];

    if (this.hasVariants) {
      if (variantsPayload.length === 0) {
        this.formError = 'Agrega al menos una variante';
        return;
      }
      const emptyName = variantsPayload.some((v) => !v.name.trim());
      if (emptyName) {
        this.formError = 'Todas las variantes necesitan un nombre';
        return;
      }
      const names = variantsPayload.map((v) => v.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) {
        this.formError = 'No puedes tener dos variantes con el mismo nombre';
        return;
      }
      const noStock = variantsPayload.some((v) => v.stock <= 0);
      if (noStock) {
        this.formError = 'Todas las variantes necesitan stock mayor a 0';
        return;
      }
    }

    if (!this.selectedFile && !this.previewUrl && !this.hasVariants) {
      this.formError = 'Debes seleccionar una imagen';
      return;
    }

    this.syncAvailability();
    this.saving = true;
    this.formError = '';

    const payload: ProductPayload = {
      name: this.form.name,
      price: this.isProduct ? this.form.price : (this.form.price > 0 ? this.form.price : null),
      type: this.form.type,
      stock: this.hasVariants ? 0 : (this.isStockBased ? this.form.stock : 0),
      isAvailable: this.form.isAvailable,
      isMadeToOrder: this.isProduct && this.form.isMadeToOrder,
      categoryId: this.form.categoryId || null,
      description: this.form.description,
      imageFile: this.selectedFile,
      variants: variantsPayload
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
    this.form = {
      name: '',
      price: 0,
      type: 'producto',
      stock: 0,
      isAvailable: true,
      isMadeToOrder: false,
      categoryId: '',
      description: ''
    };
    this.hasVariants = false;
    this.variantRows = [];
    this.selectedFile = null;
    this.previewUrl = '';
    this.formError = '';
  }
}

import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product, ProductVariant } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';

type SortOption = 'recientes' | 'gustados' | 'precio-asc' | 'precio-desc' | 'nombre-asc' | 'nombre-desc';

@Component({
  selector: 'app-catalogo',
  imports: [NgIf, NgFor, FormsModule, RouterLink],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css'
})
export class CatalogoComponent {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  readonly products = signal<Product[]>([]);
  readonly filtered = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  searchTerm = '';
  selectedCategoryId = '';
  selectedSellerId = '';
  sortOption: SortOption = 'gustados';
  filtersOpen = false;

  // Variante seleccionada por producto (productId -> índice)
  selectedVariant = new Map<string, number>();

  hasVariants(product: Product): boolean {
    return (product.variants ?? []).length > 0;
  }

  getVariantPrice(product: Product, index: number): number | null {
    const variant = product.variants[index];
    if (!variant) return null;
    return variant.price ?? product.price ?? null;
  }

  getVariantImage(product: Product, index: number): string {
    const variant = product.variants[index];
    return variant?.imageUrl || product.imageUrl;
  }

  getVariantStock(product: Product, index: number): number {
    const variant = product.variants[index];
    return variant?.stock ?? 0;
  }

  isVariantAvailable(product: Product, index: number): boolean {
    const stock = this.getVariantStock(product, index);
    if (product.isMadeToOrder) return true;
    return product.type === 'producto' ? stock > 0 : true;
  }

  // Precio mínimo entre variantes (para mostrar "Desde $X")
  getMinPrice(product: Product): number | null {
    if (!this.hasVariants(product)) return product.price ?? null;
    const prices = product.variants
      .map((v, i) => this.getVariantPrice(product, i))
      .filter((p): p is number => p !== null && p !== undefined && p > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  }

  // Precio visible: el de la variante seleccionada o "Desde $X"
  getDisplayPrice(product: Product): number | null {
    if (!this.hasVariants(product)) return product.price ?? null;
    const idx = this.selectedVariant.get(product._id);
    if (idx !== undefined) {
      return this.getVariantPrice(product, idx);
    }
    return this.getMinPrice(product);
  }

  getDisplayImage(product: Product): string {
    if (!this.hasVariants(product)) return product.imageUrl;
    const idx = this.selectedVariant.get(product._id);
    if (idx !== undefined) {
      return this.getVariantImage(product, idx);
    }
    return product.imageUrl;
  }

  isDisplayedVariantAvailable(product: Product): boolean {
    if (!this.hasVariants(product)) return product.isAvailable;
    const idx = this.selectedVariant.get(product._id);
    if (idx === undefined) {
      // Sin selección: disponible si al menos una variante lo está
      return product.variants.some((_, i) => this.isVariantAvailable(product, i));
    }
    return this.isVariantAvailable(product, idx);
  }

  getPriceLabel(product: Product): string {
    const price = this.getDisplayPrice(product);
    if (price === null || price === undefined) return 'Cotizar';
    if (this.hasVariants(product) && this.selectedVariant.get(product._id) === undefined) {
      return `Desde $${price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  onSelectVariant(product: Product, index: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedVariant.set(product._id, index);
    // Forzar re-render: se reasigna el Map para que Angular detecte el cambio
    this.selectedVariant = new Map(this.selectedVariant);
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  closeFilters(): void {
    this.filtersOpen = false;
  }

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  private loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el catálogo. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => {
        // Silencioso
      }
    });
  }

  getSellers(): { id: string; name: string }[] {
    const seen = new Map<string, string>();
    for (const p of this.products()) {
      if (typeof p.sellerId === 'string') continue;
      const seller = p.sellerId;
      if (seller?._id && seller.name) {
        seen.set(seller._id, seller.name);
      }
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    let list = this.products();

    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (this.getSellerName(p)?.toLowerCase().includes(term) ?? false) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategoryId) {
      list = list.filter((p) => {
        const catId = typeof p.categoryId === 'string' ? p.categoryId : p.categoryId?._id;
        return catId === this.selectedCategoryId;
      });
    }

    if (this.selectedSellerId) {
      list = list.filter((p) => {
        const sellerId = typeof p.sellerId === 'string' ? p.sellerId : p.sellerId?._id;
        return sellerId === this.selectedSellerId;
      });
    }

    list = [...list].sort((a, b) => {
      switch (this.sortOption) {
        case 'gustados':
          return (b.likes ?? 0) - (a.likes ?? 0);
        case 'precio-asc':
          return (a.price ?? 0) - (b.price ?? 0);
        case 'precio-desc':
          return (b.price ?? 0) - (a.price ?? 0);
        case 'nombre-asc':
          return a.name.localeCompare(b.name);
        case 'nombre-desc':
          return b.name.localeCompare(a.name);
        case 'recientes':
        default: {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        }
      }
    });

    this.filtered.set(list);
  }

  onSearch(): void {
    this.applyFilters();
  }

  getSellerName(product: Product): string {
    if (typeof product.sellerId === 'string') return '';
    return product.sellerId?.name ?? '';
  }

  getSellerLocation(product: Product): string {
    if (typeof product.sellerId === 'string') return product.location;
    const sellerLocation = product.sellerId?.location ?? '';
    if (sellerLocation) return sellerLocation;
    return product.location;
  }

  getCategoryName(categoryId: string | null | { _id: string; name: string } | undefined): string {
    if (!categoryId) return '';
    if (typeof categoryId !== 'string') return categoryId.name;
    const cat = this.categories().find((c) => c._id === categoryId);
    return cat?.name ?? '';
  }

  isLiked(id: string): boolean {
    const liked = localStorage.getItem('abarrotech_likes');
    if (!liked) return false;
    try {
      return (JSON.parse(liked) as string[]).includes(id);
    } catch {
      return false;
    }
  }

  onToggleLike(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const liked = this.isLiked(product._id);
    this.productService.toggleLike(product._id, liked ? 'unlike' : 'like').subscribe({
      next: (res) => {
        product.likes = res.likes;
        this.updateLocalLikes(product._id, !liked);
        this.applyFilters();
      },
      error: () => {
        // Silencioso: no romper la navegación por un like fallido
      }
    });
  }

  private updateLocalLikes(id: string, liked: boolean): void {
    const raw = localStorage.getItem('abarrotech_likes');
    let list: string[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw) as string[];
      } catch {
        list = [];
      }
    }
    if (liked) {
      if (!list.includes(id)) list.push(id);
    } else {
      list = list.filter((x) => x !== id);
    }
    localStorage.setItem('abarrotech_likes', JSON.stringify(list));
  }
}

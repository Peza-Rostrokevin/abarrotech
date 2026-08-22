import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-producto-detalle',
  imports: [NgIf, NgFor, DatePipe, RouterLink],
  templateUrl: './producto-detalle.component.html',
  styleUrl: './producto-detalle.component.css'
})
export class ProductoDetalleComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  selectedVariant = 0;

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

  hasVariants(): boolean {
    const product = this.product();
    return !!product && (product.variants ?? []).length > 0;
  }

  getVariantImage(index: number): string {
    const product = this.product();
    const variant = product?.variants[index];
    return variant?.imageUrl || product?.imageUrl || '';
  }

  isVariantAvailable(index: number): boolean {
    const product = this.product();
    if (!product) return false;
    if (product.isMadeToOrder) return true;
    if (product.type === 'servicio') return true;
    return (product.variants[index]?.stock ?? 0) > 0;
  }

  getVariantStock(index: number): number {
    return this.product()?.variants[index]?.stock ?? 0;
  }

  getDisplayImage(): string {
    if (this.hasVariants()) {
      return this.getVariantImage(this.selectedVariant);
    }
    return this.product()?.imageUrl ?? '';
  }

  getSellerName(): string {
    const product = this.product();
    if (!product) return '';
    if (typeof product.sellerId === 'string') return '';
    return product.sellerId?.name ?? '';
  }

  getSellerLocation(): string {
    const product = this.product();
    if (!product) return '';
    if (typeof product.sellerId === 'string') return product.location;
    const sellerLocation = product.sellerId?.location ?? '';
    if (sellerLocation) return sellerLocation;
    return product.location;
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

    const product = this.product();
    const variant = this.hasVariants() ? product?.variants[this.selectedVariant] : null;
    const message = product
      ? variant
        ? `Hola, me gustaría preguntar por el producto: ${product.name} - ${variant.name}`
        : `Hola, me gustaría preguntar por el producto: ${product.name}`
      : 'Hola, me gustaría preguntar por un producto';

    return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
  }

  getWhatsAppText(): string {
    const product = this.product();
    if (!product) return 'Contactar por WhatsApp';

    if (product.type === 'servicio' && (product.price === null || product.price === undefined)) {
      return 'Cotízalo por WhatsApp';
    }
    if (product.type === 'producto' && product.isMadeToOrder) {
      return 'Ordéname por WhatsApp';
    }
    return 'Contactar por WhatsApp';
  }

  // Precio visible: el de la variante seleccionada
  getPriceLabel(): string {
    const product = this.product();
    if (!product) return '';
    if (this.hasVariants()) {
      const variant = product.variants[this.selectedVariant];
      const price = variant?.price ?? product.price;
      if (price === null || price === undefined) return 'Cotizar';
      return `$${price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (product.price === null || product.price === undefined) return 'Cotizar';
    return `$${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  isLiked(): boolean {
    const product = this.product();
    if (!product) return false;
    const liked = localStorage.getItem('abarrotech_likes');
    if (!liked) return false;
    try {
      return (JSON.parse(liked) as string[]).includes(product._id);
    } catch {
      return false;
    }
  }

  onToggleLike(): void {
    const product = this.product();
    if (!product) return;

    const liked = this.isLiked();
    this.productService.toggleLike(product._id, liked ? 'unlike' : 'like').subscribe({
      next: (res) => {
        product.likes = res.likes;
        this.updateLocalLikes(product._id, !liked);
      },
      error: () => {
        // Silencioso
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

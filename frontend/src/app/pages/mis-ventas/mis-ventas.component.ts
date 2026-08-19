import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import { Sale, PendingCustomer } from '../../models/sale.model';
import { ProductService } from '../../core/services/product.service';
import { SaleService } from '../../core/services/sale.service';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number | null;
}

interface ReportProductSummary {
  name: string;
  quantity: number;
  revenue: number;
  cost: number;
}

@Component({
  selector: 'app-mis-ventas',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './mis-ventas.component.html',
  styleUrl: './mis-ventas.component.css'
})
export class MisVentasComponent {
  private readonly productService = inject(ProductService);
  private readonly saleService = inject(SaleService);

  readonly tab = signal<'vender' | 'pendientes' | 'reportes'>('vender');
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  cart: CartItem[] = [];
  paymentMethod: 'efectivo' | 'tarjeta' | 'pendiente' = 'efectivo';
  customerName = '';
  saleMessage = '';
  saleError = '';
  selling = false;

  readonly pendingCustomers = signal<PendingCustomer[]>([]);
  pendingLoading = true;
  payAmounts: Record<string, number> = {};
  payMessage = '';
  payError = '';

  reportFrom = '';
  reportTo = '';
  readonly reportSales = signal<Sale[]>([]);
  reportLoading = false;
  reportError = '';
  costs: Record<string, number> = {};

  constructor() {
    this.loadProducts();
    this.loadPending();
  }

  private loadProducts(): void {
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

  private loadPending(): void {
    this.pendingLoading = true;
    this.saleService.getPendingCustomers().subscribe({
      next: (customers) => {
        this.pendingCustomers.set(customers);
        this.pendingLoading = false;
      },
      error: () => {
        this.pendingLoading = false;
      }
    });
  }

  setTab(tab: 'vender' | 'pendientes' | 'reportes'): void {
    this.tab.set(tab);
    // Al entrar a Reportes, si aún no hay fechas, muestra automáticamente
    // las ventas del día actual
    if (tab === 'reportes' && !this.reportFrom && !this.reportTo) {
      const today = new Date();
      const fmt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      this.reportFrom = fmt;
      this.reportTo = fmt;
      this.onLoadReport();
    }
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  addToCart(product: Product): void {
    let price = product.price ?? 0;

    if (product.type === 'servicio' && (product.price === null || product.price === undefined || product.price === 0)) {
      const input = window.prompt(`"${product.name}" no tiene precio.\nIndica el precio del servicio para agregarlo a la venta:`, '');
      if (input === null) return;
      const parsed = Number(input.trim());
      if (!input.trim() || isNaN(parsed) || parsed <= 0) {
        this.saleError = 'Precio inválido para el servicio';
        return;
      }
      price = parsed;
    }

    const existing = this.cart.find((item) => item.productId === product._id);
    if (existing) {
      if (existing.maxStock !== null && existing.quantity + 1 > existing.maxStock) {
        return;
      }
      existing.quantity += 1;
      return;
    }

    const hasStock = product.type === 'producto' && !product.isMadeToOrder;
    this.cart.push({
      productId: product._id,
      name: product.name,
      price,
      quantity: 1,
      maxStock: hasStock ? product.stock : null
    });
  }

  changeQuantity(item: CartItem, delta: number): void {
    const next = item.quantity + delta;
    if (next < 1) {
      // Al llegar a 0 el producto se elimina del carrito
      this.cart = this.cart.filter((x) => x.productId !== item.productId);
      return;
    }
    if (item.maxStock !== null && next > item.maxStock) return;
    item.quantity = next;
  }

  clearCart(): void {
    this.cart = [];
    this.customerName = '';
    this.saleError = '';
  }

  getAvailable(product: Product): boolean {
    if (!product.isAvailable) return false;
    if (product.type === 'producto' && !product.isMadeToOrder) {
      return product.stock > 0;
    }
    return true;
  }

  getStockLabel(product: Product): string {
    if (!product.isAvailable) return 'No disponible';
    if (product.type === 'producto' && !product.isMadeToOrder) {
      return `Stock: ${product.stock}`;
    }
    if (product.isMadeToOrder) return 'Sobre pedido';
    return 'Servicio';
  }

  onSubmitSale(): void {
    if (this.cart.length === 0) {
      this.saleError = 'Agrega al menos un producto al carrito';
      return;
    }
    if (this.paymentMethod === 'pendiente' && !this.customerName.trim()) {
      this.saleError = 'Las ventas pendientes requieren el nombre del cliente';
      return;
    }

    this.selling = true;
    this.saleError = '';
    this.saleMessage = '';

    const payload = {
      items: this.cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      paymentMethod: this.paymentMethod,
      customerName: this.paymentMethod === 'pendiente' ? this.customerName.trim() : undefined
    };

    this.saleService.createSale(payload).subscribe({
      next: () => {
        this.selling = false;
        this.saleMessage =
          this.paymentMethod === 'pendiente'
            ? `Venta registrada como pendiente para ${this.customerName.trim()}`
            : 'Venta registrada correctamente';
        this.clearCart();
        this.paymentMethod = 'efectivo';
        this.loadProducts();
        this.loadPending();
        setTimeout(() => (this.saleMessage = ''), 3000);
      },
      error: (err) => {
        this.selling = false;
        this.saleError = err.error?.message ?? 'Error al registrar la venta';
      }
    });
  }

  onPayCustomer(customer: PendingCustomer): void {
    const amount = this.payAmounts[customer.customerName] ?? 0;
    if (!amount || amount <= 0) {
      this.payError = 'Ingresa un monto de abono válido';
      return;
    }
    if (amount > customer.totalDebt) {
      this.payError = `El abono excede el saldo pendiente ($${customer.totalDebt.toFixed(2)})`;
      return;
    }

    this.payError = '';
    this.payMessage = '';

    this.saleService.payCustomer(customer.customerName, amount).subscribe({
      next: (res) => {
        this.payMessage = res.message;
        this.payAmounts[customer.customerName] = 0;
        this.loadPending();
        setTimeout(() => (this.payMessage = ''), 3000);
      },
      error: (err) => {
        this.payError = err.error?.message ?? 'Error al registrar el abono';
      }
    });
  }

  onDeleteSale(saleId: string, customerName: string): void {
    const confirmMsg = `¿Eliminar esta deuda de "${customerName}"?\n\nEl saldo pendiente se perderá. Esta acción no se puede deshacer.`;
    if (!window.confirm(confirmMsg)) return;

    this.saleService.deleteSale(saleId).subscribe({
      next: (res) => {
        this.payMessage = res.message;
        this.loadPending();
        setTimeout(() => (this.payMessage = ''), 3000);
      },
      error: (err) => {
        this.payError = err.error?.message ?? 'Error al eliminar la deuda';
      }
    });
  }

  onLoadReport(): void {
    if (!this.reportFrom || !this.reportTo) {
      this.reportError = 'Selecciona ambas fechas del rango';
      return;
    }
    if (this.reportFrom > this.reportTo) {
      this.reportError = 'La fecha inicial no puede ser mayor a la final';
      return;
    }

    this.reportLoading = true;
    this.reportError = '';
    this.costs = {};

    this.saleService.getMySales({ from: this.reportFrom, to: this.reportTo }).subscribe({
      next: (sales) => {
        this.reportSales.set(sales);
        this.reportLoading = false;
      },
      error: () => {
        this.reportLoading = false;
        this.reportError = 'Error al cargar el reporte';
      }
    });
  }

  getReportTotals(): { count: number; revenue: number; collected: number; pending: number } {
    const sales = this.reportSales();
    return {
      count: sales.length,
      revenue: sales.reduce((sum, s) => sum + s.total, 0),
      collected: sales.reduce((sum, s) => sum + s.paid, 0),
      pending: sales.reduce((sum, s) => sum + (s.total - s.paid), 0)
    };
  }

  getReportProducts(): ReportProductSummary[] {
    const map = new Map<string, ReportProductSummary>();
    for (const sale of this.reportSales()) {
      for (const item of sale.items) {
        const existing = map.get(item.name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          map.set(item.name, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            cost: 0
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }

  getReportProfit(): { revenue: number; cost: number; profit: number } {
    const products = this.getReportProducts();
    const revenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const cost = products.reduce((sum, p) => sum + (this.costs[p.name] ?? 0) * p.quantity, 0);
    return { revenue, cost, profit: revenue - cost };
  }
}

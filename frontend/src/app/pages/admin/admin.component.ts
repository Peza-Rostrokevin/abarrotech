import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { AdminService } from '../../core/services/admin.service';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-admin',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  private readonly adminService = inject(AdminService);
  private readonly categoryService = inject(CategoryService);

  readonly users = signal<User[]>([]);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tab = signal<'vendedores' | 'productos' | 'categorias'>('vendedores');
  readonly inviteLink = signal('');
  readonly inviteError = signal('');
  readonly generatingInvite = signal(false);
  readonly copied = signal(false);
  readonly categoriesLoading = signal(false);
  readonly categoryError = signal('');
  readonly categorySuccess = signal('');

  @ViewChild('categoryInput') categoryInput!: ElementRef<HTMLInputElement>;

  categoryName = '';
  editingCategoryId: string | null = null;
  savingCategory = false;
  showCategoryForm = false;

  constructor() {
    this.loadData();
    this.loadCategories();
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

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.categoryError.set('Error al cargar categorías');
        this.categoriesLoading.set(false);
      }
    });
  }

  setTab(tab: 'vendedores' | 'productos' | 'categorias'): void {
    this.tab.set(tab);
    if (tab !== 'categorias') {
      this.showCategoryForm = false;
      this.editingCategoryId = null;
      this.categoryName = '';
    }
  }

  onNewCategory(): void {
    this.editingCategoryId = null;
    this.categoryName = '';
    this.categoryError.set('');
    this.categorySuccess.set('');
    this.showCategoryForm = true;
    setTimeout(() => this.categoryInput?.nativeElement?.focus(), 0);
  }

  onSaveCategory(): void {
    const name = this.categoryName.trim();
    if (!name) {
      this.categoryError.set('El nombre de la categoría es obligatorio');
      return;
    }

    const normalized = name.toLowerCase();
    const exists = this.categories().some(
      (c) => c.name.toLowerCase() === normalized && c._id !== this.editingCategoryId
    );
    if (exists) {
      this.categoryError.set('Ya existe una categoría con ese nombre');
      return;
    }

    this.savingCategory = true;
    this.categoryError.set('');
    this.categorySuccess.set('');

    const request = this.editingCategoryId
      ? this.categoryService.updateCategory(this.editingCategoryId, { name })
      : this.categoryService.createCategory({ name });

    const wasEditing = this.editingCategoryId !== null;

    request.subscribe({
      next: () => {
        this.savingCategory = false;
        this.categoryName = '';
        this.editingCategoryId = null;
        this.showCategoryForm = false;
        this.categorySuccess.set(wasEditing ? 'Categoría actualizada' : 'Categoría creada');
        setTimeout(() => this.categorySuccess.set(''), 2500);
        this.loadCategories();
      },
      error: (err) => {
        this.savingCategory = false;
        this.categoryError.set(err.error?.message ?? 'Error al guardar la categoría');
      }
    });
  }

  onEditCategory(category: Category): void {
    this.editingCategoryId = category._id;
    this.categoryName = category.name;
    this.categoryError.set('');
    this.categorySuccess.set('');
    this.showCategoryForm = true;
    setTimeout(() => this.categoryInput?.nativeElement?.focus(), 0);
  }

  onDeleteCategory(category: Category): void {
    const confirmMsg = `¿Eliminar la categoría "${category.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    this.categoryService.deleteCategory(category._id).subscribe({
      next: () => {
        this.categorySuccess.set('Categoría eliminada');
        setTimeout(() => this.categorySuccess.set(''), 2500);
        this.loadCategories();
      },
      error: (err) => {
        this.categoryError.set(err.error?.message ?? 'Error al eliminar la categoría');
      }
    });
  }

  onCancelEditCategory(): void {
    this.editingCategoryId = null;
    this.categoryName = '';
    this.categoryError.set('');
    this.categorySuccess.set('');
    this.showCategoryForm = false;
  }

  onGenerateInvite(): void {
    this.generatingInvite.set(true);
    this.inviteError.set('');
    this.copied.set(false);

    this.adminService.generateInvite().subscribe({
      next: (res) => {
        this.generatingInvite.set(false);
        const url = `${window.location.origin}/registro?token=${res.token}`;
        this.inviteLink.set(url);
      },
      error: () => {
        this.generatingInvite.set(false);
        this.inviteError.set('Error al generar la invitación');
      }
    });
  }

  onCopyInvite(): void {
    const link = this.inviteLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
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

  getProductLocation(product: Product): string {
    if (typeof product.sellerId === 'string') return product.location || '-';
    return product.sellerId?.location || product.location || '-';
  }
}

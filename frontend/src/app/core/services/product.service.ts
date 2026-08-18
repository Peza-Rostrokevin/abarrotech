import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductPayload } from '../../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllProducts(params?: {
    q?: string;
    categoryId?: string;
    sellerId?: string;
    sortBy?: 'likes' | 'price' | 'name' | 'createdAt';
    order?: 'asc' | 'desc';
  }): Observable<Product[]> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.sellerId) query.set('sellerId', params.sellerId);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.order) query.set('order', params.order);
    const qs = query.toString();
    return this.http.get<Product[]>(`${this.apiUrl}/products${qs ? `?${qs}` : ''}`);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getMyProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/mine`);
  }

  createProduct(payload: ProductPayload): Observable<Product> {
    if (payload.imageFile) {
      return this.http.post<Product>(`${this.apiUrl}/products`, this.buildFormData(payload));
    }
    return this.http.post<Product>(`${this.apiUrl}/products`, payload);
  }

  updateProduct(id: string, payload: Partial<ProductPayload>): Observable<Product> {
    if (payload.imageFile) {
      return this.http.put<Product>(`${this.apiUrl}/products/${id}`, this.buildFormData(payload));
    }
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, payload);
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/products/${id}`);
  }

  toggleLike(id: string, action: 'like' | 'unlike'): Observable<{ likes: number }> {
    return this.http.post<{ likes: number }>(`${this.apiUrl}/products/${id}/like`, { action });
  }

  private buildFormData(payload: Partial<ProductPayload>): FormData {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.price !== undefined) formData.append('price', payload.price === null ? '' : String(payload.price));
    if (payload.type !== undefined) formData.append('type', payload.type);
    if (payload.stock !== undefined) formData.append('stock', String(payload.stock));
    if (payload.isAvailable !== undefined) formData.append('isAvailable', String(payload.isAvailable));
    if (payload.isMadeToOrder !== undefined) formData.append('isMadeToOrder', String(payload.isMadeToOrder));
    if (payload.location !== undefined) formData.append('location', payload.location);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.categoryId !== undefined) formData.append('categoryId', payload.categoryId ?? '');
    if (payload.imageFile) formData.append('image', payload.imageFile);
    return formData;
  }
}

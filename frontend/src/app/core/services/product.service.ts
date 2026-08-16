import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductPayload } from '../../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
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

  private buildFormData(payload: Partial<ProductPayload>): FormData {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.price !== undefined) formData.append('price', String(payload.price));
    if (payload.location !== undefined) formData.append('location', payload.location);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.imageFile) formData.append('image', payload.imageFile);
    return formData;
  }
}

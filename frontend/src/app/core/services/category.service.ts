import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CategoryPayload } from '../../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createCategory(payload: CategoryPayload): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, payload);
  }

  updateCategory(id: string, payload: CategoryPayload): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, payload);
  }

  deleteCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/categories/${id}`);
  }
}

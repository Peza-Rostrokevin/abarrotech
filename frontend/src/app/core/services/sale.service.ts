import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sale, SalePayload, PendingCustomer } from '../../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  createSale(payload: SalePayload): Observable<Sale> {
    return this.http.post<Sale>(`${this.apiUrl}/sales`, payload);
  }

  getMySales(params?: { from?: string; to?: string; status?: string }): Observable<Sale[]> {
    const query = new URLSearchParams();
    // Convierte "yyyy-MM-dd" a instante ISO (medianoche hora local del usuario)
    // para que el rango abarque el día completo sin desfase de zona horaria
    if (params?.from) query.set('from', this.toUtcInstant(params.from));
    if (params?.to) query.set('to', this.toUtcInstant(params.to));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return this.http.get<Sale[]>(`${this.apiUrl}/sales${qs ? `?${qs}` : ''}`);
  }

  private toUtcInstant(date: string): string {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toISOString();
  }

  getPendingCustomers(): Observable<PendingCustomer[]> {
    return this.http.get<PendingCustomer[]>(`${this.apiUrl}/sales/pending`);
  }

  payCustomer(customerName: string, amount: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/sales/pay`, {
      customerName,
      amount
    });
  }

  deleteSale(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/sales/${id}`);
  }
}

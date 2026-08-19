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
    const from = this.toUtcInstant(params?.from);
    const to = this.toUtcInstant(params?.to);
    // Solo envía las fechas si son válidas; si no, el backend devuelve todo
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return this.http.get<Sale[]>(`${this.apiUrl}/sales${qs ? `?${qs}` : ''}`);
  }

  // Convierte "yyyy-MM-dd" a instante ISO UTC. Devuelve '' si la fecha
  // no es válida para nunca lanzar RangeError y romper el componente
  private toUtcInstant(date?: string): string {
    if (!date) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) return '';
    const [, y, m, d] = match.map(Number);
    const parsed = new Date(y, m - 1, d);
    if (
      isNaN(parsed.getTime()) ||
      parsed.getFullYear() !== y ||
      parsed.getMonth() !== m - 1 ||
      parsed.getDate() !== d
    ) {
      return '';
    }
    return parsed.toISOString();
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

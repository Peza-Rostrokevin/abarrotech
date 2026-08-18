export type PaymentMethod = 'efectivo' | 'tarjeta' | 'pendiente';
export type SaleStatus = 'pagado' | 'pendiente' | 'parcial';

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface SalePayment {
  amount: number;
  paidAt: string;
}

export interface Sale {
  _id: string;
  sellerId: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  paid: number;
  payments: SalePayment[];
  status: SaleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SalePayload {
  items: { productId: string; quantity: number; price?: number }[];
  paymentMethod: PaymentMethod;
  customerName?: string;
}

export interface PendingCustomer {
  customerName: string;
  totalDebt: number;
  sales: {
    _id: string;
    createdAt: string;
    total: number;
    paid: number;
    remaining: number;
    status: SaleStatus;
    items: SaleItem[];
  }[];
}

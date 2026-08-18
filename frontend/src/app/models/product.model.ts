export type ProductType = 'producto' | 'servicio';

export interface Product {
  _id: string;
  name: string;
  price: number | null;
  type: ProductType;
  stock: number;
  isAvailable: boolean;
  isMadeToOrder: boolean;
  likes: number;
  categoryId: string | null | { _id: string; name: string };
  imageUrl: string;
  location: string;
  description: string;
  sellerId: string | { _id: string; name: string; email?: string; phone?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductPayload {
  name: string;
  price: number | null;
  type: ProductType;
  stock: number;
  isAvailable: boolean;
  isMadeToOrder: boolean;
  location: string;
  description: string;
  categoryId?: string | null;
  imageFile?: File | null;
}

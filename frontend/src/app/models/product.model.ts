export type ProductType = 'producto' | 'servicio';

export interface ProductVariant {
  name: string;
  price: number | null;
  stock: number;
  imageUrl: string;
}

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
  variants: ProductVariant[];
  sellerId: string | { _id: string; name: string; email?: string; phone?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariantPayload {
  name: string;
  price: number | null;
  stock: number;
  imageUrl?: string;
  imageFile?: File | null;
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
  variants?: ProductVariantPayload[];
}

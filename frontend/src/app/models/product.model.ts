export type ProductType = 'producto' | 'servicio';

export interface ProductVariant {
  name: string;
  price: number | null;
  stock: number;
  imageUrl: string;
}

export interface ProductSeller {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
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
  sellerId: string | ProductSeller;
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
  description: string;
  categoryId?: string | null;
  imageFile?: File | null;
  variants?: ProductVariantPayload[];
}
